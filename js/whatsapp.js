/* =========================================================================
   WhatsApp para agendamentos (fase 1: sem servidor, links wa.me)
   Módulo independente: não lê nem grava o banco. Quem chama passa os dados.
   Encaixes no backoffice:
     - modal da reserva ......... WA.botoes({reserva,cliente,servico,pro,marca,cfg})
     - painel Hoje .............. WA.painelLembretes(itens, cfg)   itens = WA.pendentes(...)
     - Ajustes .................. WA.editor(cfg)  +  WA.lerEditor()  ao salvar
     - Marca / site / app ....... WA.linkAgendar(cfg, marca)  (botão "Agendar pelo WhatsApp")
   Campos usados:
     cliente.tel, cliente.whatsapp_ok (false = não enviar)
     reserva.lembrete_enviado_em (ISO), reserva.data (AAAA-MM-DD), reserva.hora (HH:MM), reserva.status
     cfg (empresas.cfg) = { wa_numero, wa_endereco, wa_modelos:{confirmacao,lembrete,pos,reagendar,agendar} }
     cliente.whatsapp_ok: true ou null/ausente = pode enviar; false = pediu para não receber.
   Script clássico: define o objeto global WA (sem import/export).
   ========================================================================= */
(function (global) {
  "use strict";

  var MODELOS0 = {
    confirmacao:
      "Olá, {primeiro_nome}! Sua reserva no {spa} está confirmada:\n" +
      "{servico} com {profissional}\n{dia_semana}, {data}, às {hora}.\n" +
      "{endereco_linha}Se precisar remarcar, é só responder esta mensagem.",
    lembrete:
      "Olá, {primeiro_nome}! Passando para lembrar do seu {servico} amanhã, {data}, às {hora}, com {profissional}.\n" +
      "Chegue uns 15 minutos antes para começar com calma.\n" +
      "Pode confirmar respondendo SIM? Se não puder vir, responda REMARCAR.",
    pos:
      "Olá, {primeiro_nome}! Obrigado pela visita ao {spa} hoje. Como você está se sentindo depois do {servico}?\n" +
      "Quando quiser voltar, é só responder por aqui.",
    reagendar:
      "Olá, {primeiro_nome}! Precisamos remarcar o seu {servico} de {data}, às {hora}. " +
      "Quais dias e horários ficam bons para você?",
    agendar: "Olá! Gostaria de agendar um horário no {spa}."
  };

  var ROTULOS = {
    confirmacao: "Confirmação da reserva",
    lembrete: "Lembrete da véspera",
    pos: "Depois da visita",
    reagendar: "Pedido para remarcar",
    agendar: "Mensagem de quem clica em Agendar pelo WhatsApp"
  };

  var BOTAO = { confirmacao: "Enviar confirmação", lembrete: "Enviar lembrete", pos: "Mensagem pós-visita", reagendar: "Pedir para remarcar" };

  var DIAS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* Telefone brasileiro -> formato internacional só com dígitos (5511987654321).
     Retorna "" quando não dá para usar. */
  function numero(tel) {
    var d = String(tel || "").replace(/\D/g, "");
    if (!d) return "";
    if (d.indexOf("00") === 0) d = d.slice(2);
    if (d.length === 10 || d.length === 11) d = "55" + d.replace(/^0/, "");
    else if ((d.length === 11 || d.length === 12) && d[0] === "0") d = "55" + d.slice(1);
    if (d.indexOf("55") === 0 && (d.length < 12 || d.length > 13)) return "";
    if (d.length < 10 || d.length > 15) return "";
    return d;
  }

  /* aceita cfg da empresa ({wa_numero,...}) ou o formato curto ({numero,...}) */
  function norm(cfg) {
    cfg = cfg || {};
    return { numero: cfg.wa_numero || cfg.numero || "", endereco: cfg.wa_endereco || cfg.endereco || "", modelos: cfg.wa_modelos || cfg.modelos || {} };
  }

  function modelos(cfg) {
    var m = {}, src = norm(cfg).modelos;
    for (var k in MODELOS0) m[k] = src[k] && String(src[k]).trim() ? src[k] : MODELOS0[k];
    return m;
  }

  function dataBr(iso) {
    var p = String(iso || "").split("-");
    return p.length === 3 ? p[2] + "/" + p[1] : iso || "";
  }
  function diaSemana(iso) {
    var p = String(iso || "").split("-").map(Number);
    if (p.length !== 3) return "";
    return DIAS[new Date(p[0], p[1] - 1, p[2]).getDay()];
  }

  function variaveis(o) {
    o = o || {};
    var r = o.reserva || {}, c = o.cliente || {}, s = o.servico || {}, p = o.pro || {}, m = o.marca || {}, cfg = norm(o.cfg);
    var nome = (c.nome || "").trim();
    var end = (cfg.endereco || "").trim();
    return {
      nome: nome,
      primeiro_nome: nome.split(/\s+/)[0] || "",
      servico: s.nome || "",
      profissional: (p.nome || "").split(/\s+/)[0] || "",
      data: dataBr(r.data),
      dia_semana: diaSemana(r.data),
      hora: r.hora || "",
      spa: m.empresa || m.nome || "",
      endereco: end,
      endereco_linha: end ? "Endereço: " + end + "\n" : ""
    };
  }

  function preencher(texto, vars) {
    return String(texto || "")
      .replace(/\{(\w+)\}/g, function (all, k) { return k in vars ? vars[k] : all; })
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function link(tel, texto) {
    var n = numero(tel);
    if (!n) return "";
    return "https://wa.me/" + n + (texto ? "?text=" + encodeURIComponent(texto) : "");
  }

  function mensagem(tipo, o) {
    return preencher(modelos(o && o.cfg)[tipo], variaveis(o));
  }

  /* Link do spa para clientes iniciarem conversa (bio do Instagram, site, app). */
  function linkAgendar(cfg, marca) {
    var n = norm(cfg).numero;
    if (!n) return "";
    return link(n, preencher(modelos(cfg).agendar, variaveis({ marca: marca, cfg: cfg })));
  }

  /* Qual mensagem faz sentido para o status atual da reserva. */
  function sugeridas(r) {
    var st = (r && r.status) || "";
    if (st === "concluida") return ["pos"];
    if (st === "cancelada" || st === "falta") return ["reagendar"];
    if (st === "checkin") return [];
    return ["confirmacao", "lembrete", "reagendar"];
  }

  var ICONE = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" style="flex:none"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.3z"/></svg>';

  /* Bloco de botões para o modal da reserva. Cada botão abre o WhatsApp com a
     mensagem pronta; data-wa-tipo e data-wa-reserva permitem registrar o envio. */
  function botoes(o) {
    var c = (o && o.cliente) || {}, r = (o && o.reserva) || {};
    if (!numero(c.tel))
      return '<div class="full wa-bloco"><p class="wa-aviso">Cadastre um celular válido do cliente para enviar mensagens pelo WhatsApp.</p></div>';
    if (c.whatsapp_ok === false)
      return '<div class="full wa-bloco"><p class="wa-aviso">Este cliente pediu para não receber mensagens pelo WhatsApp.</p></div>';
    var tipos = sugeridas(r);
    if (!tipos.length) return "";
    var envio = r.lembrete_enviado_em ? '<span class="wa-ok">Lembrete enviado em ' + esc(fmtQuando(r.lembrete_enviado_em)) + "</span>" : "";
    return '<div class="full wa-bloco"><div class="wa-tit">' + ICONE + " WhatsApp " + envio + '</div><div class="wa-btns">' +
      tipos.map(function (t) {
        return '<a class="btn sm wa-btn" target="_blank" rel="noopener" data-wa-tipo="' + t + '" data-wa-reserva="' + esc(r.id || "") +
          '" href="' + esc(link(c.tel, mensagem(t, o))) + '">' + esc(BOTAO[t]) + "</a>";
      }).join("") + "</div></div>";
  }

  function fmtQuando(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + " " +
      String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  /* Reservas que precisam de lembrete: data = alvo (padrão: amanhã), ativas, ainda não lembradas.
     ctx = { reservas, cliente(id), servico(id), pro(id), marca, cfg, data } */
  function pendentes(ctx) {
    var alvo = ctx.data;
    if (!alvo) { var d = new Date(); d.setDate(d.getDate() + 1); alvo = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
    return (ctx.reservas || [])
      .filter(function (r) { return r.data === alvo && (r.status === "confirmada" || r.status === "pendente"); })
      .sort(function (a, b) { return String(a.hora).localeCompare(String(b.hora)); })
      .map(function (r) {
        var o = { reserva: r, cliente: ctx.cliente(r.cliente), servico: ctx.servico(r.servico), pro: ctx.pro(r.pro), marca: ctx.marca, cfg: ctx.cfg };
        var ok = !!numero(o.cliente.tel) && o.cliente.whatsapp_ok !== false;
        return { reserva: r, o: o, enviado: !!r.lembrete_enviado_em, url: ok ? link(o.cliente.tel, mensagem("lembrete", o)) : "", motivo: ok ? "" : (o.cliente.whatsapp_ok === false ? "não quer receber" : "sem celular") };
      });
  }

  function painelLembretes(itens, titulo) {
    var falta = itens.filter(function (i) { return !i.enviado && i.url; }).length;
    return '<div class="panel wa-painel"><div class="ph">' + esc(titulo || "Lembretes de amanhã") +
      '<span class="wa-cont">' + (itens.length ? falta + " de " + itens.length + " para enviar" : "") + '</span></div><div class="pb"><div class="list">' +
      (itens.length ? itens.map(function (i) {
        var r = i.reserva, o = i.o;
        var acao = i.enviado ? '<span class="wa-ok">Enviado</span>'
          : i.url ? '<a class="btn sm wa-btn" target="_blank" rel="noopener" data-wa-tipo="lembrete" data-wa-reserva="' + esc(r.id) + '" href="' + esc(i.url) + '">' + ICONE + " Enviar</a>"
          : '<span class="wa-aviso">' + esc(i.motivo) + "</span>";
        return '<div class="row" style="grid-template-columns:52px minmax(0,1fr) auto"><div class="t num">' + esc(r.hora) + '</div><div style="min-width:0"><div class="n">' + esc(o.cliente.nome) +
          '</div><div class="d">' + esc(o.servico.nome) + " · " + esc((o.pro.nome || "").split(" ")[0]) + "</div></div>" + acao + "</div>";
      }).join("") : '<div class="empty">Nenhuma reserva para amanhã.</div>') + "</div></div></div>";
  }

  /* Editor dos modelos (Ajustes). Ids wa-*; leia de volta com WA.lerEditor(). */
  function editor(cfg) {
    var m = modelos(cfg);
    cfg = norm(cfg);
    return '<div class="panel wa-editor"><h2>WhatsApp</h2><div class="pb"><div class="form" style="padding:0">' +
      '<label>WhatsApp do spa<input class="f" id="wa-numero" inputmode="tel" placeholder="(11) 99999-0000" value="' + esc(cfg.numero || "") + '"></label>' +
      '<label>Endereço nas mensagens<input class="f" id="wa-endereco" placeholder="Rua, número, bairro" value="' + esc(cfg.endereco || "") + '"></label>' +
      Object.keys(MODELOS0).map(function (k) {
        return '<label class="full">' + esc(ROTULOS[k]) + '<textarea class="f" rows="4" id="wa-m-' + k + '">' + esc(m[k]) + "</textarea></label>";
      }).join("") +
      '<p class="full wa-dica">Use {primeiro_nome}, {nome}, {servico}, {profissional}, {data}, {dia_semana}, {hora}, {spa}, {endereco} e {endereco_linha} (endereço numa linha própria, some quando está vazio). Deixe um campo vazio para voltar ao texto padrão.</p>' +
      "</div></div></div>";
  }

  function lerEditor(doc) {
    doc = doc || document;
    var v = function (id) { var el = doc.getElementById(id); return el ? el.value.trim() : ""; };
    var mods = {};
    Object.keys(MODELOS0).forEach(function (k) { var t = v("wa-m-" + k); if (t && t !== MODELOS0[k]) mods[k] = t; });
    return { wa_numero: v("wa-numero"), wa_endereco: v("wa-endereco"), wa_modelos: mods };
  }

  /* Chama onEnviado(reservaId, tipo) quando alguém clica num botão de WhatsApp.
     Use para gravar reserva.lembrete_enviado_em = new Date().toISOString(). */
  function aoEnviar(onEnviado, raiz) {
    (raiz || document).addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-wa-tipo]");
      if (a && a.dataset.waReserva) onEnviado(a.dataset.waReserva, a.dataset.waTipo);
    });
  }

  var CSS = ".wa-bloco{border:1px solid var(--linha,#ddd);border-radius:10px;padding:10px 12px}" +
    ".wa-tit{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--tinta2,#666);margin-bottom:8px}" +
    ".wa-btns{display:flex;flex-wrap:wrap;gap:6px}.wa-btn{display:inline-flex;align-items:center;gap:6px;text-decoration:none}" +
    ".wa-ok{font-size:12px;font-weight:500;text-transform:none;letter-spacing:0;color:#1f7a4d}.wa-aviso{margin:0;font-size:12.5px;color:var(--tinta2,#666)}" +
    ".wa-cont{font-weight:400;font-size:12px;color:var(--tinta2,#666)}.wa-dica{margin:0;font-size:12px;color:var(--tinta2,#666)}";
  function estilos() {
    if (typeof document === "undefined" || document.getElementById("wa-css")) return;
    var st = document.createElement("style"); st.id = "wa-css"; st.textContent = CSS; document.head.appendChild(st);
  }

  var WA = { norm: norm, MODELOS0: MODELOS0, ROTULOS: ROTULOS, numero: numero, modelos: modelos, variaveis: variaveis, preencher: preencher,
    link: link, mensagem: mensagem, linkAgendar: linkAgendar, sugeridas: sugeridas, botoes: botoes, pendentes: pendentes,
    painelLembretes: painelLembretes, editor: editor, lerEditor: lerEditor, aoEnviar: aoEnviar, estilos: estilos, CSS: CSS };
  if (typeof module !== "undefined" && module.exports) module.exports = WA; else global.WA = WA;
})(this);

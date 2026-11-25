
const MODO=(window.CONFIG&&CONFIG.supabaseUrl&&CONFIG.supabaseAnonKey)?"nuvem":"local";
const APP_EXEMPLO={android:"apps/vivarium.apk",versao:"0.3-prototipo",tamanho:"1,3 MB",data:"19/11/2026",icone:"apps/vivarium-icone.png",ios:"testflight",iosBuild:"7",iosData:"25/11/2026",iosNome:"Vivarium Spa",iosLink:""};

/* ---------- utilidades ---------- */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad=n=>String(n).padStart(2,"0");
const iso=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const parse=s=>{const[a,b,c]=s.split("-").map(Number);return new Date(a,b-1,c)};
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return iso(d)};
const today=()=>iso(new Date());
const toMin=h=>{const[a,b]=h.split(":").map(Number);return a*60+b};
const toHora=m=>pad(Math.floor(m/60))+":"+pad(m%60);
const brl=v=>"R$ "+Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:0,maximumFractionDigits:0});
const DOW=["dom","seg","ter","qua","qui","sex","sáb"];
const MES=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const fmtData=s=>{const d=parse(s);return DOW[d.getDay()]+", "+d.getDate()+" "+MES[d.getMonth()]};
const fmtLonga=s=>{const d=parse(s);return ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"][d.getDay()]+", "+d.getDate()+" de "+["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"][d.getMonth()]};
const uid=()=>(window.crypto&&crypto.randomUUID)?crypto.randomUUID():"10000000-1000-4000-8000-100000000000".replace(/[018]/g,c=>(c^Math.random()*16>>c/4).toString(16));
const ini=n=>n.split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();

const CATS0=[{id:"mente",n:"Mente",c:"#748479"},{id:"corpo",n:"Corpo",c:"#b49f8c"},{id:"conexao",n:"Conexão",c:"#6d5042"},{id:"fluxo",n:"Fluxo",c:"#7c9aa2"}];
const MARCA0={empresa:"Vivarium Spa",nome:"Vivarium",sub:"Backoffice",logo:"",logoSym:true,logoMono:true,primaria:"#28442d",destaque:"#7d8a55",fundo:"#efe9e0",fTitulo:"Cormorant Garamond",fTexto:"Montserrat"};
let PILAR={};
function buildCats(cats){PILAR={};(cats||db.cats).forEach(c=>PILAR[c.id]={n:c.n,c:c.c});}
const pz=k=>PILAR[k]||{n:"Sem categoria",c:"#999"};
const STATUS={pendente:"Pendente",confirmada:"Confirmada",checkin:"Em atendimento",concluida:"Concluída",cancelada:"Cancelada",falta:"Não compareceu"};
const ORIGENS=["App","WhatsApp","Telefone","Balcão","Site"];

/* ---------- dados de exemplo ---------- */
function seed(){
  const salas=["Sala Raiz","Sala Copa","Casa de Banho","Sala Semente","Jardim"];
  const servicos=[
    {id:"s1",nome:"Ritual Raiz",pilar:"corpo",dur:90,preco:420,intervalo:15,sala:"Sala Raiz",ativo:true,app:true,descricao:"Massagem profunda com óleos quentes e pedras do rio."},
    {id:"s2",nome:"Ritual Copa",pilar:"mente",dur:60,preco:320,intervalo:15,sala:"Sala Copa",ativo:true,app:true,descricao:"Cabeça, rosto e couro cabeludo para aquietar a mente."},
    {id:"s3",nome:"Banho de Mangue",pilar:"fluxo",dur:75,preco:360,intervalo:20,sala:"Casa de Banho",ativo:true,app:true,descricao:"Argila de mangue, ducha morna e hidratação."},
    {id:"s4",nome:"Imersão Vivarium",pilar:"conexao",dur:180,preco:980,intervalo:30,sala:"Sala Raiz",ativo:true,app:true,descricao:"Jornada completa pelas cinco estações do spa."},
    {id:"s5",nome:"Ritual Semente",pilar:"corpo",dur:45,preco:210,intervalo:10,sala:"Sala Semente",ativo:true,app:true,descricao:"Pés e pernas, para quem tem pouco tempo."},
    {id:"s6",nome:"Respiro Guiado",pilar:"mente",dur:30,preco:120,intervalo:10,sala:"Jardim",ativo:true,app:false,descricao:"Sessão de respiração em grupo pequeno no jardim."}
  ];
  const pros=[
    {id:"p1",nome:"Marina Alves",funcao:"Terapeuta corporal",cor:"#28442d",servicos:["s1","s4","s5"],dias:[1,2,3,4,5],ini:"09:00",fim:"18:00",ativo:true},
    {id:"p2",nome:"Caio Mendes",funcao:"Massoterapeuta",cor:"#653618",servicos:["s1","s2","s5"],dias:[2,3,4,5,6],ini:"10:00",fim:"20:00",ativo:true},
    {id:"p3",nome:"Lívia Rocha",funcao:"Esteticista",cor:"#7c9aa2",servicos:["s2","s3","s4"],dias:[1,3,4,5,6],ini:"09:00",fim:"19:00",ativo:true},
    {id:"p4",nome:"Rafael Sato",funcao:"Instrutor de respiração",cor:"#7d8a55",servicos:["s6","s2"],dias:[1,2,4,6],ini:"08:00",fim:"14:00",ativo:true}
  ];
  const nomes=[["Ana Ferraz","(11) 98712-4410","ana.ferraz@exemplo.com","App"],["Beatriz Lemos","(11) 99654-2231","bia.lemos@exemplo.com","WhatsApp"],["Carlos Nogueira","(11) 97733-8120","carlos.n@exemplo.com","Telefone"],["Daniela Prado","(11) 98820-1145","dani.prado@exemplo.com","App"],["Eduardo Queiroz","(11) 99101-5532","edu.q@exemplo.com","Balcão"],["Fernanda Lima","(11) 98455-7720","fe.lima@exemplo.com","App"],["Gustavo Reis","(11) 97210-6634","gustavo.reis@exemplo.com","Site"],["Helena Costa","(11) 99877-3301","helena.c@exemplo.com","App"],["Isabela Moura","(11) 98123-9087","isa.moura@exemplo.com","WhatsApp"],["João Pedro Vaz","(11) 99654-1209","jp.vaz@exemplo.com","Telefone"],["Larissa Toledo","(11) 98320-4456","lari.t@exemplo.com","App"],["Mateus Ribeiro","(11) 97455-8812","mateus.r@exemplo.com","Site"]];
  const aromas=["Lavanda","Capim-limão","Sem aroma","Eucalipto","Laranja doce"],pres=["Leve","Média","Firme"],temps=["Morna","Quente","Fresca"],mus=["Natureza","Silêncio","Piano","Sons de água"];
  let r=7;const rnd=()=>(r=(r*9301+49297)%233280)/233280;const pick=a=>a[Math.floor(rnd()*a.length)];
  const clientes=nomes.map((n,i)=>({id:"c"+(i+1),nome:n[0],tel:n[1],email:n[2],origem:n[3],desde:addDays(today(),-Math.floor(30+rnd()*400)),pref:{aroma:pick(aromas),pressao:pick(pres),temperatura:pick(temps),musica:pick(mus)},obs:i===0?"Prefere a Marina. Sensível a óleos cítricos.":i===4?"Gestante, 22 semanas. Evitar pedras quentes.":""}));
  const db={salas,servicos,pros,clientes,reservas:[],cfg:{abre:"08:00",fecha:"21:00",passo:15},marca:{...MARCA0},cats:CATS0.map(c=>({...c}))};
  const t=today(),ocC={};
  for(let d=-10;d<=12;d++){
    const dia=addDays(t,d),dow=parse(dia).getDay();
    if(dow===0)continue;
    for(const p of pros){
      if(!p.dias.includes(dow))continue;
      let m=toMin(p.ini)+(rnd()<.5?0:30);
      const fim=toMin(p.fim);
      while(true){
        if(rnd()<.28){m+=30;}
        const sid=pick(p.servicos),s=servicos.find(x=>x.id===sid);
        if(m+s.dur>fim)break;
        let c=pick(clientes);for(let k=0;k<8&&(ocC[dia+c.id]||[]).some(([i,f])=>m<f&&i<m+s.dur+30);k++)c=pick(clientes);
        (ocC[dia+c.id]=ocC[dia+c.id]||[]).push([m-30,m+s.dur]);
        let st=d<0?(rnd()<.08?"falta":rnd()<.1?"cancelada":"concluida"):d===0?"confirmada":(rnd()<.25?"pendente":"confirmada");
        if(d>0&&rnd()<.04)st="cancelada";
        db.reservas.push({id:uid(),cliente:c.id,servico:s.id,pro:p.id,sala:s.sala,data:dia,hora:toHora(m),status:st,origem:rnd()<.45?"App":pick(ORIGENS),preco:s.preco,obs:""});
        m+=s.dur+s.intervalo;
        if(d>3&&rnd()<.35)break;
      }
    }
  }
  // ajusta o dia de hoje para refletir o horário atual
  const agora=new Date(),nm=agora.getHours()*60+agora.getMinutes();
  db.reservas.filter(x=>x.data===t).forEach(x=>{const s=db.servicos.find(y=>y.id===x.servico),a=toMin(x.hora);if(a+s.dur<=nm)x.status="concluida";else if(a<=nm)x.status="checkin";});
  // salas: evitar choques nos exemplos
  const ocup={};
  db.reservas.sort((a,b)=>(a.data+a.hora).localeCompare(b.data+b.hora)).forEach(x=>{const s=db.servicos.find(y=>y.id===x.servico),a=toMin(x.hora),b=a+s.dur+s.intervalo;const livre=[x.sala,...salas].find(sl=>!(ocup[x.data+sl]||[]).some(([i,f])=>a<f&&i<b));x.sala=livre||x.sala;(ocup[x.data+x.sala]=ocup[x.data+x.sala]||[]).push([a,b]);});
  return db;
}

const KEY="vivarium-backoffice-v2";
let db=null;
function normalizar(d){if(!d.marca||!Object.keys(d.marca).length)d.marca={...MARCA0,logoSym:MODO==="local"};else d.marca={...MARCA0,logoSym:false,...d.marca};if(!d.cats)d.cats=CATS0.map(c=>({...c}));if(!d.cfg||!d.cfg.abre)d.cfg={abre:"08:00",fecha:"21:00",passo:15};if(!d.salas)d.salas=[];["servicos","pros","clientes","reservas"].forEach(k=>{if(!d[k])d[k]=[]});return d}
WA.estilos();
WA.aoEnviar((rid,tipo)=>{const r=db.reservas.find(x=>x.id===rid);if(!r)return;if(tipo==="lembrete")r.lembrete_enviado_em=new Date().toISOString();save();setTimeout(()=>{if(!document.querySelector("#mform"))render()},300)});
function waCtx(){return {reservas:db.reservas,cliente:C,servico:S,pro:P,marca:db.marca,cfg:db.cfg}}
function save(){if(MODO==="nuvem"){Nuvem.agendar();return}try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){}}

const S=id=>db.servicos.find(x=>x.id===id)||{nome:"(removido)",dur:60,pilar:"mente",preco:0,intervalo:0};
const P=id=>db.pros.find(x=>x.id===id)||{nome:"(removido)",cor:"#999"};
const C=id=>db.clientes.find(x=>x.id===id)||{nome:"(removido)"};
const ativa=r=>r.status!=="cancelada"&&r.status!=="falta";

/* ---------- estado de tela ---------- */
const ui={dia:today(),vista:"dia",busca:"",fStatus:"todas",fPeriodo:"proximas",cBusca:""};
try{Object.assign(ui,JSON.parse(sessionStorage.getItem("vb-ui")||"{}"));}catch(e){}
function keepUi(){try{sessionStorage.setItem("vb-ui",JSON.stringify({vista:ui.vista,fStatus:ui.fStatus,fPeriodo:ui.fPeriodo}))}catch(e){}}

const ICO={
 painel:'<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 4v3h6V4z"/>',
 agenda:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
 reservas:'<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r=".8"/><circle cx="4" cy="12" r=".8"/><circle cx="4" cy="18" r=".8"/>',
 clientes:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.8a3.3 3.3 0 0 1 0 6.4M18 14.8c1.8.7 3 2.4 3.5 5.2"/>',
 servicos:'<path d="M12 21c-4.5-2-7-5.6-7-10 3.4 0 5.6 1.3 7 3.5 1.4-2.2 3.6-3.5 7-3.5 0 4.4-2.5 8-7 10z"/><path d="M12 14.5V3M9 6l3-3 3 3"/>',
 profissionais:'<circle cx="12" cy="7.5" r="3.5"/><path d="M5 20.5c.9-4 3.6-6 7-6s6.1 2 7 6"/>',
 app:'<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M12 8v6M9.5 11.5 12 14l2.5-2.5M10.5 18.5h3"/>',
 marca:'<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 1.6-2.1-.5-1.2.3-2.4 1.6-2.4H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
 ajustes:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M4.2 6.5l2.3 1.7M17.5 15.8l2.3 1.7M4.2 17.5l2.3-1.7M17.5 8.2l2.3-1.7"/>'
};
const ROTAS=[["painel","Hoje"],["agenda","Agenda"],["reservas","Reservas"],["clientes","Clientes"],["g","Cadastros"],["servicos","Serviços"],["profissionais","Profissionais"],["g","Empresa"],["marca","Marca e identidade"],["ajustes","Ajustes"],["g","Aplicativo"],["app","Baixar o app"]];
function rotas(){return window.Nuvem?Nuvem.rotas(ROTAS):ROTAS}
function rota(){const h=location.hash.slice(1);return rotas().some(r=>r[0]===h)?h:"painel"}
function renderNav(){
  const r=rota();
  const m=(rota()==="marca"&&draft)?draft.marca:db.marca;
  $("#brand").innerHTML=logoHtml(m)+`<div style="min-width:0"><b>${esc(m.nome||m.empresa)}</b><small>${esc(m.sub)}</small></div>`;
  if(window.Nuvem)Nuvem.rodape();
  $("#nav").innerHTML=rotas().map(([k,n])=>k==="g"?`<div class="grp">${n}</div>`:`<a href="#${k}" class="${k===r?"on":""}"><svg viewBox="0 0 24 24">${ICO[k]||ICO.ajustes}</svg><span>${n}</span></a>`).join("");
}
function render(){if(!db)return;if(rota()!=="marca"||!draft){applyBrand(db.marca);buildCats();}renderNav();const r=rota();$("#main").innerHTML=VIEWS[r]();if(r==="agenda")afterAgenda();if(r==="marca")afterMarca();if(window.Nuvem)Nuvem.depois(r);}
window.addEventListener("hashchange",()=>{if(rota()!=="marca")draft=null;render();window.scrollTo(0,0)});

function toast(m){const t=document.createElement("div");t.className="toast";t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2400)}
const pill=s=>`<span class="pill st-${s}">${STATUS[s]}</span>`;
const pilar=k=>`<span class="pilar"><i style="background:${pz(k).c}"></i>${esc(pz(k).n)}</span>`;

/* ---------- Hoje ---------- */
function vPainel(){
  const t=today(),hoje=db.reservas.filter(r=>r.data===t),at=hoje.filter(ativa);
  const agora=new Date(),nm=agora.getHours()*60+agora.getMinutes();
  const receita=at.reduce((a,r)=>a+Number(r.preco||0),0);
  const pend=db.reservas.filter(r=>r.status==="pendente"&&r.data>=t);
  const dow=parse(t).getDay();
  const trabalham=db.pros.filter(p=>p.ativo&&p.dias.includes(dow));
  const cap=trabalham.reduce((a,p)=>a+toMin(p.fim)-toMin(p.ini),0);
  const usado=at.reduce((a,r)=>a+S(r.servico).dur,0);
  const occ=cap?Math.round(usado/cap*100):0;
  let proxTit="Próximos atendimentos";
  let prox=at.filter(r=>toMin(r.hora)+S(r.servico).dur>nm||r.status==="checkin").sort((a,b)=>a.hora.localeCompare(b.hora)).slice(0,7);
  if(!prox.length){const am=addDays(t,1);prox=db.reservas.filter(r=>r.data===am&&ativa(r)).sort((a,b)=>a.hora.localeCompare(b.hora)).slice(0,7);if(prox.length)proxTit="Amanhã";}
  const semana=db.reservas.filter(r=>r.data>t&&r.data<=addDays(t,7)&&ativa(r));
  const app=db.reservas.filter(r=>r.data>=addDays(t,-30)&&r.data<=t&&r.origem==="App").length,tot=db.reservas.filter(r=>r.data>=addDays(t,-30)&&r.data<=t).length;
  return `<div class="head"><div><h1>${fmtLonga(t)}</h1><p>${at.length} atendimentos hoje · ${trabalham.length} profissionais na casa</p></div>
  <div class="tools"><a class="btn" href="#agenda">Ver agenda</a><button class="btn pri" data-act="nova">+ Nova reserva</button></div></div>
  <div class="grid g-kpi">
    <div class="panel kpi"><div class="l">Atendimentos hoje</div><div class="v num">${at.length}</div><div class="s">${hoje.filter(r=>r.status==="concluida").length} concluídos · ${hoje.filter(r=>r.status==="checkin").length} em sala</div></div>
    <div class="panel kpi"><div class="l">Ocupação das agendas</div><div class="v num">${occ}%</div><div class="s">${Math.round(usado/60)}h de ${Math.round(cap/60)}h disponíveis</div></div>
    <div class="panel kpi"><div class="l">Receita prevista hoje</div><div class="v num">${brl(receita)}</div><div class="s">${brl(semana.reduce((a,r)=>a+Number(r.preco||0),0))} nos próximos 7 dias</div></div>
    <div class="panel kpi"><div class="l">Aguardando confirmação</div><div class="v num">${pend.length}</div><div class="s">${tot?Math.round(app/tot*100):0}% das reservas do mês vieram do app</div></div>
  </div>
  <div class="grid g-2" style="margin-top:16px">
    <div class="panel"><div class="ph">${proxTit}<a href="#agenda">Agenda do dia</a></div><div class="pb"><div class="list">
    ${prox.length?prox.map(r=>{const s=S(r.servico);return `<div class="row" data-act="abrir" data-id="${r.id}"><div class="t num">${r.hora}</div><div class="bar" style="background:${pz(s.pilar).c}"></div><div style="min-width:0"><div class="n">${esc(C(r.cliente).nome)}</div><div class="d">${esc(s.nome)} · ${esc(P(r.pro).nome.split(" ")[0])} · ${esc(r.sala)}</div></div>${pill(r.status)}</div>`}).join(""):'<div class="empty">Nenhum atendimento hoje nem amanhã.</div>'}
    </div></div></div>
    <div class="grid" style="align-content:start">
      ${WA.painelLembretes(WA.pendentes(waCtx()))}
      <div class="panel"><h2>Ocupação por profissional</h2><div class="pb"><div class="occ">
      ${trabalham.map(p=>{const c=toMin(p.fim)-toMin(p.ini),u=at.filter(r=>r.pro===p.id).reduce((a,r)=>a+S(r.servico).dur,0),pc=Math.min(100,Math.round(u/c*100));return `<div class="o"><span>${esc(p.nome.split(" ")[0])}</span><div class="track"><div class="fill" style="width:${pc}%;background:${p.cor}"></div></div><span class="num" style="text-align:right">${pc}%</span></div>`}).join("")||'<div class="empty">Ninguém escalado hoje.</div>'}
      </div></div></div>
      <div class="panel"><div class="ph">Para confirmar<a href="#reservas" data-act="verpend">Ver todas</a></div><div class="pb"><div class="list">
      ${pend.slice(0,4).map(r=>`<div class="row" data-act="abrir" data-id="${r.id}" style="grid-template-columns:72px minmax(0,1fr) auto"><div class="t num" style="font-size:12px">${fmtData(r.data).split(", ")[1]}<br><span style="font-weight:400;color:var(--tinta2)">${r.hora}</span></div><div style="min-width:0"><div class="n">${esc(C(r.cliente).nome)}</div><div class="d">${esc(S(r.servico).nome)} · via ${r.origem}</div></div><button class="btn sm" data-act="confirmar" data-id="${r.id}">Confirmar</button></div>`).join("")||'<div class="empty">Tudo confirmado.</div>'}
      </div></div></div>
    </div>
  </div>`;
}

/* ---------- Agenda ---------- */
const K=1.3;// px por minuto
function vAgenda(){
  const d=ui.dia;
  let corpo="";
  if(ui.vista==="dia"){
    const abre=toMin(db.cfg.abre),fecha=toMin(db.cfg.fecha),H=(fecha-abre)*K,dow=parse(d).getDay();
    const pros=db.pros.filter(p=>p.ativo);
    let horas="";for(let m=abre;m<=fecha;m+=60)horas+=`<div style="top:${(m-abre)*K}px">${toHora(m)}</div>`;
    const cols=pros.map(p=>{
      const off=!p.dias.includes(dow);
      const evs=db.reservas.filter(r=>r.data===d&&r.pro===p.id).map(r=>{const s=S(r.servico),top=(toMin(r.hora)-abre)*K,h=Math.max(28,s.dur*K-2);return `<div class="ev ${r.status}" style="top:${top}px;height:${h}px;--c:${pz(s.pilar).c}" data-act="abrir" data-id="${r.id}" title="${esc(C(r.cliente).nome)} · ${esc(s.nome)}"><b>${r.hora} ${esc(C(r.cliente).nome)}</b><span>${esc(s.nome)}</span>${h>58?`<span>${esc(r.sala)} · ${STATUS[r.status]}</span>`:""}</div>`}).join("");
      const fora=off?"":`<div style="position:absolute;left:0;right:0;top:0;height:${Math.max(0,(toMin(p.ini)-abre)*K)}px;background:rgba(65,68,47,.06)"></div><div style="position:absolute;left:0;right:0;top:${(toMin(p.fim)-abre)*K}px;bottom:0;background:rgba(65,68,47,.06)"></div>`;
      return `<div class="col ${off?"off":""}" style="height:${H}px" data-pro="${p.id}">${fora}${evs}</div>`;
    }).join("");
    const heads=pros.map(p=>`<div class="calh"><div class="av" style="background:${p.cor}">${ini(p.nome)}</div><div style="min-width:0"><b>${esc(p.nome.split(" ")[0])}</b><small>${p.dias.includes(dow)?p.ini+"–"+p.fim:"folga"}</small></div></div>`).join("");
    corpo=`<div class="cal" id="cal"><div class="calg" id="calg" style="grid-template-columns:56px repeat(${pros.length},minmax(170px,1fr));--hh:${60*K}px">
      <div class="calh corner"></div>${heads}
      <div class="times" style="height:${H}px">${horas}</div>${cols}
    </div></div>`;
  }else{
    const ini0=addDays(d,-((parse(d).getDay()+6)%7));
    corpo=`<div class="week">${[0,1,2,3,4,5,6].map(i=>{const dia=addDays(ini0,i),rs=db.reservas.filter(r=>r.data===dia).sort((a,b)=>a.hora.localeCompare(b.hora));
      return `<div class="wd ${dia===today()?"today":""}"><h4 data-act="irdia" data-d="${dia}">${fmtData(dia)}<small>${rs.filter(ativa).length}</small></h4>${rs.map(r=>`<div class="wchip ${r.status}" style="--c:${pz(S(r.servico).pilar).c}" data-act="abrir" data-id="${r.id}"><b class="num">${r.hora}</b> ${esc(C(r.cliente).nome.split(" ")[0])} · ${esc(S(r.servico).nome)}</div>`).join("")||'<div class="empty" style="padding:16px 4px">Sem reservas</div>'}</div>`}).join("")}</div>`;
  }
  const titulo=ui.vista==="dia"?fmtLonga(d):(()=>{const a=addDays(d,-((parse(d).getDay()+6)%7)),b=addDays(a,6);return `Semana de ${parse(a).getDate()} ${MES[parse(a).getMonth()]} a ${parse(b).getDate()} ${MES[parse(b).getMonth()]}`})();
  return `<div class="head"><div><h1>Agenda</h1><p>Clique num horário livre para reservar. Clique numa reserva para ver, remarcar ou mudar o status.</p></div><div class="tools"><button class="btn pri" data-act="nova">+ Nova reserva</button></div></div>
  <div class="agbar"><div class="seg"><button data-act="nav" data-n="-1" aria-label="Anterior">‹</button><button data-act="hoje">Hoje</button><button data-act="nav" data-n="1" aria-label="Próximo">›</button></div>
  <input type="date" class="f" id="agdata" value="${d}" style="width:auto">
  <div class="seg"><button class="${ui.vista==="dia"?"on":""}" data-act="vista" data-v="dia">Dia</button><button class="${ui.vista==="semana"?"on":""}" data-act="vista" data-v="semana">Semana</button></div>
  <div class="date">${titulo}</div></div>
  ${corpo}
  <div class="legend" style="margin-top:12px">${Object.values(PILAR).map(p=>`<span class="pilar"><i style="background:${p.c}"></i>${esc(p.n)}</span>`).join("")}<span>Borda tracejada: aguardando confirmação</span></div>`;
}
function afterAgenda(){
  const inp=$("#agdata");if(inp)inp.onchange=()=>{if(inp.value){ui.dia=inp.value;render()}};
  const cal=$("#cal");if(!cal)return;
  const abre=toMin(db.cfg.abre),t=today();
  if(ui.dia===t){const n=new Date(),m=n.getHours()*60+n.getMinutes();if(m>abre&&m<toMin(db.cfg.fecha)){cal.querySelectorAll(".col").forEach(c=>{const l=document.createElement("div");l.className="now";l.style.top=(m-abre)*K+"px";c.appendChild(l)});cal.scrollTop=Math.max(0,(m-abre)*K-120);}}
  else cal.scrollTop=Math.max(0,(9*60-abre)*K-20);
  cal.querySelectorAll(".col").forEach(c=>c.addEventListener("click",e=>{
    if(e.target.closest(".ev")||c.classList.contains("off"))return;
    const y=e.clientY-c.getBoundingClientRect().top,m=abre+Math.floor(y/K/db.cfg.passo)*db.cfg.passo;
    abrirReserva(null,{pro:c.dataset.pro,data:ui.dia,hora:toHora(m)});
  }));
}

/* ---------- Reservas ---------- */
function vReservas(){
  const t=today();let rs=db.reservas.slice();
  if(ui.fPeriodo==="proximas")rs=rs.filter(r=>r.data>=t);else if(ui.fPeriodo==="hoje")rs=rs.filter(r=>r.data===t);else if(ui.fPeriodo==="passadas")rs=rs.filter(r=>r.data<t);
  if(ui.fStatus!=="todas")rs=rs.filter(r=>r.status===ui.fStatus);
  const q=ui.busca.trim().toLowerCase();
  if(q)rs=rs.filter(r=>(C(r.cliente).nome+" "+S(r.servico).nome+" "+P(r.pro).nome).toLowerCase().includes(q));
  rs.sort((a,b)=>ui.fPeriodo==="passadas"?(b.data+b.hora).localeCompare(a.data+a.hora):(a.data+a.hora).localeCompare(b.data+b.hora));
  const total=rs.filter(ativa).reduce((a,r)=>a+Number(r.preco||0),0);
  return `<div class="head"><div><h1>Reservas</h1><p>${rs.length} reservas · ${brl(total)} em atendimentos válidos</p></div><div class="tools"><button class="btn pri" data-act="nova">+ Nova reserva</button></div></div>
  <div class="agbar">
    <input class="f search" id="busca" placeholder="Buscar cliente, serviço ou profissional" value="${esc(ui.busca)}">
    <div class="seg">${[["hoje","Hoje"],["proximas","Próximas"],["passadas","Passadas"],["todas","Todas"]].map(([k,n])=>`<button class="${ui.fPeriodo===k?"on":""}" data-act="periodo" data-v="${k}">${n}</button>`).join("")}</div>
    <select class="f" id="fstatus" style="width:auto"><option value="todas">Todos os status</option>${Object.entries(STATUS).map(([k,n])=>`<option value="${k}" ${ui.fStatus===k?"selected":""}>${n}</option>`).join("")}</select>
  </div>
  <div class="panel"><div class="tw"><table><thead><tr><th>Quando</th><th>Cliente</th><th>Serviço</th><th>Profissional</th><th>Sala</th><th>Origem</th><th style="text-align:right">Valor</th><th>Status</th></tr></thead><tbody>
  ${rs.slice(0,200).map(r=>{const s=S(r.servico);return `<tr class="click" data-act="abrir" data-id="${r.id}"><td class="num" style="white-space:nowrap"><b>${fmtData(r.data)}</b><span class="sub">${r.hora}–${toHora(toMin(r.hora)+s.dur)}</span></td><td>${esc(C(r.cliente).nome)}<span class="sub">${esc(C(r.cliente).tel||"")}</span></td><td>${esc(s.nome)}<span class="sub">${pilar(s.pilar)}</span></td><td>${esc(P(r.pro).nome)}</td><td>${esc(r.sala)}</td><td>${r.origem}</td><td class="num" style="text-align:right">${brl(r.preco)}</td><td>${pill(r.status)}</td></tr>`}).join("")}
  </tbody></table>${rs.length?"":'<div class="empty">Nenhuma reserva com esses filtros.</div>'}</div></div>`;
}

/* ---------- Clientes ---------- */
function vClientes(){
  const q=ui.cBusca.trim().toLowerCase(),t=today();
  const cs=db.clientes.filter(c=>!q||(c.nome+" "+c.tel+" "+c.email).toLowerCase().includes(q)).sort((a,b)=>a.nome.localeCompare(b.nome));
  return `<div class="head"><div><h1>Clientes</h1><p>${db.clientes.length} cadastrados · preferências sensoriais vindas do app</p></div><div class="tools"><button class="btn pri" data-act="novocliente">+ Novo cliente</button></div></div>
  <div class="agbar"><input class="f search" id="cbusca" placeholder="Buscar por nome, telefone ou e-mail" value="${esc(ui.cBusca)}"></div>
  <div class="panel"><div class="tw"><table><thead><tr><th>Cliente</th><th>Contato</th><th>Visitas</th><th>Última visita</th><th>Próxima</th><th style="text-align:right">Total gasto</th><th>Origem</th></tr></thead><tbody>
  ${cs.map(c=>{const rs=db.reservas.filter(r=>r.cliente===c.id),feitas=rs.filter(r=>r.status==="concluida"),ult=feitas.map(r=>r.data).sort().pop(),prox=rs.filter(r=>r.data>=t&&ativa(r)&&r.status!=="concluida").map(r=>r.data).sort()[0];
    return `<tr class="click" data-act="cliente" data-id="${c.id}"><td><b>${esc(c.nome)}</b>${c.obs?`<span class="sub">${esc(c.obs.slice(0,42))}${c.obs.length>42?"…":""}</span>`:""}</td><td>${esc(c.tel)}<span class="sub">${esc(c.email)}</span></td><td class="num">${feitas.length}</td><td class="num">${ult?fmtData(ult):"—"}</td><td class="num">${prox?fmtData(prox):"—"}</td><td class="num" style="text-align:right">${brl(feitas.reduce((a,r)=>a+Number(r.preco||0),0))}</td><td>${c.origem}</td></tr>`}).join("")}
  </tbody></table>${cs.length?"":'<div class="empty">Nenhum cliente encontrado.</div>'}</div></div>`;
}
function abrirCliente(id){
  const c=C(id),t=today(),rs=db.reservas.filter(r=>r.cliente===id).sort((a,b)=>(b.data+b.hora).localeCompare(a.data+a.hora));
  const feitas=rs.filter(r=>r.status==="concluida");
  $("#layer").innerHTML=`<div class="scrim" data-act="fechar" style="justify-content:flex-end;padding:0"></div><aside class="drawer" role="dialog" aria-label="${esc(c.nome)}"><div class="in">
   <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div><div class="lbl">Cliente desde ${fmtData(c.desde)}</div><h3 style="font:500 32px/1.1 var(--display);margin:4px 0 0">${esc(c.nome)}</h3></div><button class="x" data-act="fechar" aria-label="Fechar">×</button></div>
   <div style="display:flex;gap:8px;margin:14px 0 18px;flex-wrap:wrap"><button class="btn pri sm" data-act="nova" data-cliente="${id}">+ Reservar</button><button class="btn sm" data-act="editcliente" data-id="${id}">Editar cadastro</button></div>
   <dl class="dl"><dt>Telefone</dt><dd>${esc(c.tel)}</dd><dt>E-mail</dt><dd style="word-break:break-all">${esc(c.email)}</dd><dt>Chegou por</dt><dd>${c.origem}</dd></dl>
   <h4 class="lbl" style="margin:22px 0 8px">Perfil sensorial</h4>
   <dl class="dl"><dt>Aroma</dt><dd>${esc(c.pref.aroma)}</dd><dt>Pressão</dt><dd>${esc(c.pref.pressao)}</dd><dt>Temperatura</dt><dd>${esc(c.pref.temperatura)}</dd><dt>Som</dt><dd>${esc(c.pref.musica)}</dd></dl>
   ${c.obs?`<div class="info" style="margin-top:14px">${esc(c.obs)}</div>`:""}
   <h4 class="lbl" style="margin:22px 0 8px">Anéis do terrário · ${feitas.length} visitas</h4>
   <div class="rings">${feitas.slice().reverse().map(r=>`<i style="--c:${pz(S(r.servico).pilar).c}" title="${fmtData(r.data)} · ${esc(S(r.servico).nome)}"></i>`).join("")||'<span style="font-size:12.5px;color:var(--tinta2)">Ainda sem visitas concluídas.</span>'}</div>
   <h4 class="lbl" style="margin:22px 0 4px">Histórico</h4>
   <div class="list">${rs.map(r=>`<div class="row" data-act="abrir" data-id="${r.id}" style="grid-template-columns:86px minmax(0,1fr) auto"><div class="t num" style="font-size:12px">${fmtData(r.data)}<br><span style="font-weight:400;color:var(--tinta2)">${r.hora}</span></div><div style="min-width:0"><div class="n">${esc(S(r.servico).nome)}</div><div class="d">${esc(P(r.pro).nome)}</div></div>${pill(r.status)}</div>`).join("")||'<div class="empty">Sem reservas.</div>'}</div>
  </div></aside>`;
}

/* ---------- Serviços ---------- */
function vServicos(){
  return `<div class="head"><div><h1>Serviços</h1><p>Os serviços abaixo são exemplos. Edite nomes, durações e preços para os da casa.</p></div><div class="tools"><button class="btn pri" data-act="editservico">+ Novo serviço</button></div></div>
  <div class="cards">${db.servicos.map(s=>`<div class="card ${s.ativo?"":"inactive"}" data-act="editservico" data-id="${s.id}">
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">${pilar(s.pilar)}${s.app?'<span class="tag">Visível no app</span>':'<span class="tag off">Só no balcão</span>'}</div>
    <h3>${esc(s.nome)}</h3><p>${esc(s.descricao)}</p>
    <div class="meta num"><span><b>${s.dur} min</b> + ${s.intervalo} de preparo</span><span><b>${brl(s.preco)}</b></span><span>${esc(s.sala)}</span></div>
    <div class="tags">${db.pros.filter(p=>p.servicos.includes(s.id)).map(p=>`<span class="tag">${esc(p.nome.split(" ")[0])}</span>`).join("")||'<span class="tag off">Sem profissional habilitado</span>'}${s.ativo?"":'<span class="tag off">Inativo</span>'}</div>
  </div>`).join("")}</div>`;
}
function editServico(id){
  const s=id?S(id):{id:"",nome:"",pilar:"corpo",dur:60,preco:0,intervalo:15,sala:db.salas[0],ativo:true,app:true,descricao:""};
  modal(`${id?"Editar":"Novo"} serviço`,id?"Mudanças valem para novas reservas.":"Aparece na agenda e, se marcado, no app do cliente.",`
   <label class="full">Nome<input class="f" id="sv-nome" value="${esc(s.nome)}" required></label>
   <label>Categoria<select class="f" id="sv-pilar">${Object.entries(PILAR).map(([k,p])=>`<option value="${k}" ${s.pilar===k?"selected":""}>${esc(p.n)}</option>`).join("")}</select></label>
   <label>Sala padrão<select class="f" id="sv-sala">${db.salas.map(x=>`<option ${s.sala===x?"selected":""}>${esc(x)}</option>`).join("")}</select></label>
   <label>Duração (min)<input class="f num" type="number" min="10" step="5" id="sv-dur" value="${s.dur}"></label>
   <label>Preparo da sala depois (min)<input class="f num" type="number" min="0" step="5" id="sv-int" value="${s.intervalo}"></label>
   <label>Preço (R$)<input class="f num" type="number" min="0" step="10" id="sv-preco" value="${s.preco}"></label>
   <label class="full">Descrição para o cliente<textarea class="f" id="sv-desc">${esc(s.descricao)}</textarea></label>
   <div class="full"><div class="lbl" style="margin-bottom:6px">Quem pode atender</div><div class="checks">${db.pros.map(p=>`<label><input type="checkbox" class="sv-pro" value="${p.id}" ${id&&p.servicos.includes(id)?"checked":""}>${esc(p.nome)}</label>`).join("")}</div></div>
   <label class="chk"><input type="checkbox" id="sv-ativo" ${s.ativo?"checked":""}>Ativo</label>
   <label class="chk"><input type="checkbox" id="sv-app" ${s.app?"checked":""}>Mostrar no app</label>`,
  ()=>{const nome=$("#sv-nome").value.trim();if(!nome)return "Dê um nome ao serviço.";
    const o=id?s:{id:uid()};Object.assign(o,{nome,pilar:$("#sv-pilar").value,sala:$("#sv-sala").value,dur:+$("#sv-dur").value||60,intervalo:+$("#sv-int").value||0,preco:+$("#sv-preco").value||0,descricao:$("#sv-desc").value.trim(),ativo:$("#sv-ativo").checked,app:$("#sv-app").checked});
    if(!id)db.servicos.push(o);
    const sel=[...document.querySelectorAll(".sv-pro:checked")].map(x=>x.value);
    db.pros.forEach(p=>{p.servicos=p.servicos.filter(x=>x!==o.id);if(sel.includes(p.id))p.servicos.push(o.id)});
    return "Serviço salvo";},
  id&&!db.reservas.some(r=>r.servico===id)?()=>{db.servicos=db.servicos.filter(x=>x.id!==id);db.pros.forEach(p=>p.servicos=p.servicos.filter(x=>x!==id));return "Serviço excluído"}:null);
}

/* ---------- Profissionais ---------- */
function vPros(){
  const t=today();
  return `<div class="head"><div><h1>Profissionais</h1><p>Jornada semanal e serviços que cada pessoa atende. A agenda só aceita reservas dentro desses horários.</p></div><div class="tools"><button class="btn pri" data-act="editpro">+ Nova profissional</button></div></div>
  <div class="cards">${db.pros.map(p=>{const sem=db.reservas.filter(r=>r.pro===p.id&&r.data>=t&&r.data<=addDays(t,6)&&ativa(r)).length;return `<div class="card ${p.ativo?"":"inactive"}" data-act="editpro" data-id="${p.id}">
    <div class="pro-top"><div class="av" style="background:${p.cor}">${ini(p.nome)}</div><div><h3>${esc(p.nome)}</h3><p>${esc(p.funcao)}</p></div></div>
    <div class="days">${[1,2,3,4,5,6,0].map(d=>`<span class="${p.dias.includes(d)?"on":""}">${DOW[d][0].toUpperCase()}</span>`).join("")}</div>
    <div class="meta num"><span><b>${p.ini}–${p.fim}</b></span><span><b>${sem}</b> atendimentos nos próximos 7 dias</span></div>
    <div class="tags">${p.servicos.map(id=>`<span class="tag">${esc(S(id).nome)}</span>`).join("")}${p.ativo?"":'<span class="tag off">Inativa</span>'}</div>
  </div>`}).join("")}</div>`;
}
function editPro(id){
  const p=id?P(id):{nome:"",funcao:"",cor:"#7d8a55",servicos:[],dias:[1,2,3,4,5],ini:"09:00",fim:"18:00",ativo:true};
  const cores=["#28442d","#41442f","#7d8a55","#653618","#bc9471","#7c9aa2","#6d5042","#748479"];
  modal(`${id?"Editar":"Nova"} profissional`,"Os dias e horários definem onde dá para reservar na agenda.",`
   <label>Nome<input class="f" id="pr-nome" value="${esc(p.nome)}"></label>
   <label>Função<input class="f" id="pr-funcao" value="${esc(p.funcao)}"></label>
   <label>Início da jornada<input class="f" type="time" id="pr-ini" value="${p.ini}"></label>
   <label>Fim da jornada<input class="f" type="time" id="pr-fim" value="${p.fim}"></label>
   <div class="full"><div class="lbl" style="margin-bottom:6px">Dias de trabalho</div><div class="checks">${[1,2,3,4,5,6,0].map(d=>`<label><input type="checkbox" class="pr-dia" value="${d}" ${p.dias.includes(d)?"checked":""}>${DOW[d]}</label>`).join("")}</div></div>
   <div class="full"><div class="lbl" style="margin-bottom:6px">Serviços que atende</div><div class="checks">${db.servicos.map(s=>`<label><input type="checkbox" class="pr-sv" value="${s.id}" ${p.servicos.includes(s.id)?"checked":""}>${esc(s.nome)}</label>`).join("")}</div></div>
   <div class="full"><div class="lbl" style="margin-bottom:6px">Cor na agenda</div><div class="checks">${cores.map(c=>`<label style="padding:4px 8px"><input type="radio" name="pr-cor" value="${c}" ${p.cor===c?"checked":""}><i style="width:16px;height:16px;border-radius:50%;background:${c};display:inline-block"></i></label>`).join("")}</div></div>
   <label class="chk"><input type="checkbox" id="pr-ativo" ${p.ativo?"checked":""}>Ativa na agenda</label>`,
  ()=>{const nome=$("#pr-nome").value.trim();if(!nome)return "Informe o nome.";const a=$("#pr-ini").value,b=$("#pr-fim").value;if(!a||!b||toMin(b)<=toMin(a))return "O fim da jornada precisa ser depois do início.";
    const o=id?p:{id:uid()};Object.assign(o,{nome,funcao:$("#pr-funcao").value.trim(),ini:a,fim:b,dias:[...document.querySelectorAll(".pr-dia:checked")].map(x=>+x.value),servicos:[...document.querySelectorAll(".pr-sv:checked")].map(x=>x.value),cor:(document.querySelector('[name="pr-cor"]:checked')||{}).value||p.cor,ativo:$("#pr-ativo").checked});
    if(!id)db.pros.push(o);return "Profissional salva";},
  id&&!db.reservas.some(r=>r.pro===id)?()=>{db.pros=db.pros.filter(x=>x.id!==id);return "Profissional excluída"}:null);
}

/* ---------- Cliente: cadastro ---------- */
function editCliente(id){
  const c=id?C(id):{nome:"",tel:"",email:"",origem:"Balcão",pref:{aroma:"",pressao:"Média",temperatura:"Morna",musica:"Natureza"},obs:""};
  modal(`${id?"Editar":"Novo"} cliente`,"Quem usa o app preenche o perfil sensorial por lá.",`
   <label class="full">Nome<input class="f" id="cl-nome" value="${esc(c.nome)}"></label>
   <label>Telefone<input class="f" id="cl-tel" value="${esc(c.tel)}" inputmode="tel"></label>
   <label>E-mail<input class="f" id="cl-email" value="${esc(c.email)}" inputmode="email"></label>
   <label>Chegou por<select class="f" id="cl-origem">${ORIGENS.map(o=>`<option ${c.origem===o?"selected":""}>${o}</option>`).join("")}</select></label>
   <label>Aroma preferido<input class="f" id="cl-aroma" value="${esc(c.pref.aroma)}"></label>
   <label>Pressão<select class="f" id="cl-pres">${["Leve","Média","Firme"].map(o=>`<option ${c.pref.pressao===o?"selected":""}>${o}</option>`).join("")}</select></label>
   <label>Temperatura<select class="f" id="cl-temp">${["Fresca","Morna","Quente"].map(o=>`<option ${c.pref.temperatura===o?"selected":""}>${o}</option>`).join("")}</select></label>
   <label class="full">Observações para a equipe<textarea class="f" id="cl-obs">${esc(c.obs)}</textarea></label>`,
  ()=>{const nome=$("#cl-nome").value.trim();if(!nome)return "Informe o nome.";
    const o=id?c:{id:uid(),desde:today()};Object.assign(o,{nome,tel:$("#cl-tel").value.trim(),email:$("#cl-email").value.trim(),origem:$("#cl-origem").value,obs:$("#cl-obs").value.trim(),pref:{...c.pref,aroma:$("#cl-aroma").value.trim(),pressao:$("#cl-pres").value,temperatura:$("#cl-temp").value}});
    if(!id)db.clientes.push(o);return "Cliente salvo";});
}

/* ---------- Reserva ---------- */
function conflitos(r,ignore){
  const s=S(r.servico),a=toMin(r.hora),b=a+s.dur,avisos=[],p=P(r.pro),dow=parse(r.data).getDay();
  if(!p.dias.includes(dow))avisos.push(`${p.nome.split(" ")[0]} não trabalha ${["aos domingos","às segundas","às terças","às quartas","às quintas","às sextas","aos sábados"][dow]}.`);
  else if(a<toMin(p.ini)||b>toMin(p.fim))avisos.push(`Fora da jornada de ${p.nome.split(" ")[0]} (${p.ini}–${p.fim}).`);
  if(p.servicos&&!p.servicos.includes(r.servico))avisos.push(`${p.nome.split(" ")[0]} não está habilitada para ${s.nome}.`);
  db.reservas.filter(x=>x.id!==ignore&&x.data===r.data&&ativa(x)).forEach(x=>{const xs=S(x.servico),xa=toMin(x.hora),xb=xa+xs.dur;
    if(x.pro===r.pro&&a<xb+xs.intervalo&&xa<b+s.intervalo)avisos.push(`${p.nome.split(" ")[0]} já atende ${C(x.cliente).nome} às ${x.hora}.`);
    if(x.sala===r.sala&&a<xb+xs.intervalo&&xa<b+s.intervalo)avisos.push(`${r.sala} está ocupada às ${x.hora} (${xs.nome}).`);
    if(x.cliente===r.cliente&&a<xb&&xa<b)avisos.push(`${C(r.cliente).nome} já tem ${xs.nome} às ${x.hora}.`);});
  return avisos;
}
function sugerir(r,ignore){// próximo horário livre do mesmo dia para a profissional
  const s=S(r.servico),p=P(r.pro);
  for(let m=Math.max(toMin(r.hora),toMin(p.ini));m+s.dur<=toMin(p.fim);m+=db.cfg.passo){const t={...r,hora:toHora(m)};if(!conflitos(t,ignore).length)return t.hora}
  return null;
}
function abrirReserva(id,pre={}){
  if(!id&&window.Nuvem&&!Nuvem.podeOperar()){toast("Seu perfil não cria reservas. Peça à recepção.");return}
  const r=id?db.reservas.find(x=>x.id===id):Object.assign({cliente:"",servico:db.servicos.find(s=>s.ativo)?.id,pro:"",data:ui.dia||today(),hora:"10:00",status:"confirmada",origem:"Balcão",obs:"",sala:""},pre);
  if(!id){if(!r.pro){const p=db.pros.find(p=>p.ativo&&p.servicos.includes(r.servico));r.pro=p?p.id:db.pros[0].id}
    if(pre.pro&&!P(pre.pro).servicos.includes(r.servico)){const s=db.servicos.find(s=>s.ativo&&P(pre.pro).servicos.includes(s.id));if(s)r.servico=s.id}
    r.sala=S(r.servico).sala;}
  const c=id?C(r.cliente):null;
  const statusRow=id?`<div class="statusrow">${Object.entries(STATUS).map(([k,n])=>`<button type="button" data-st="${k}" class="${r.status===k?"on":""}">${n}</button>`).join("")}</div>`:"";
  modal(id?esc(c.nome):"Nova reserva",id?`${esc(S(r.servico).nome)} · ${fmtLonga(r.data)} às ${r.hora} · criada via ${r.origem}`:"Escolha cliente, serviço e horário. A agenda avisa se houver choque.",`
   ${statusRow?`<div class="full" style="margin:0 -22px">${statusRow}</div>`:""}
   <label class="full">Cliente<select class="f" id="rv-cliente"><option value="">Selecione…</option><option value="__novo">+ Cadastrar cliente novo</option>${db.clientes.slice().sort((a,b)=>a.nome.localeCompare(b.nome)).map(x=>`<option value="${x.id}" ${r.cliente===x.id?"selected":""}>${esc(x.nome)} · ${esc(x.tel)}</option>`).join("")}</select></label>
   <div class="full" id="rv-novo" hidden><div class="form" style="padding:0"><label>Nome do cliente<input class="f" id="rv-nnome"></label><label>Telefone<input class="f" id="rv-ntel" inputmode="tel"></label></div></div>
   <label>Serviço<select class="f" id="rv-servico">${db.servicos.filter(s=>s.ativo||s.id===r.servico).map(s=>`<option value="${s.id}" ${r.servico===s.id?"selected":""}>${esc(s.nome)} · ${s.dur} min</option>`).join("")}</select></label>
   <label>Profissional<select class="f" id="rv-pro"></select></label>
   <label>Data<input class="f" type="date" id="rv-data" value="${r.data}"></label>
   <label>Horário<input class="f" type="time" step="${db.cfg.passo*60}" id="rv-hora" value="${r.hora}"></label>
   <label>Sala<select class="f" id="rv-sala">${db.salas.map(x=>`<option ${r.sala===x?"selected":""}>${esc(x)}</option>`).join("")}</select></label>
   <label>Origem<select class="f" id="rv-origem">${ORIGENS.map(o=>`<option ${r.origem===o?"selected":""}>${o}</option>`).join("")}</select></label>
   <label>Valor (R$)<input class="f num" type="number" min="0" step="10" id="rv-preco" value="${r.preco??S(r.servico).preco}"></label>
   ${id?"":`<label>Status<select class="f" id="rv-status">${["confirmada","pendente"].map(k=>`<option value="${k}" ${r.status===k?"selected":""}>${STATUS[k]}</option>`).join("")}</select></label>`}
   <label class="full">Observações<textarea class="f" id="rv-obs" placeholder="Ex.: chegar 15 min antes, alergia a amêndoas">${esc(r.obs)}</textarea></label>
   <div id="rv-aviso" class="warn" hidden></div>
   ${id?WA.botoes({reserva:r,cliente:c,servico:S(r.servico),pro:P(r.pro),marca:db.marca,cfg:db.cfg}):""}
   ${id&&c?.obs?`<div class="info">Sobre ${esc(c.nome.split(" ")[0])}: ${esc(c.obs)}</div>`:""}`,
  ()=>{let cli=$("#rv-cliente").value;
    if(cli==="__novo"){const n=$("#rv-nnome").value.trim();if(!n)return "Informe o nome do cliente novo.";const nc={id:uid(),nome:n,tel:$("#rv-ntel").value.trim(),email:"",origem:$("#rv-origem").value,desde:today(),pref:{aroma:"",pressao:"Média",temperatura:"Morna",musica:"Natureza"},obs:""};db.clientes.push(nc);cli=nc.id;}
    if(!cli)return "Escolha o cliente.";
    const v=ler();v.cliente=cli;
    const av=conflitos(v,id);
    if(av.length&&!forcar){forcar=true;mostrarAviso(av,v,true);return false;}
    const o=id?r:{id:uid()};Object.assign(o,v);if(!id){o.status=$("#rv-status").value;db.reservas.push(o)}
    ui.dia=o.data;return id?"Reserva atualizada":"Reserva criada";},
  id?()=>{r.status="cancelada";return "Reserva cancelada"}:null, id?"Cancelar reserva":null);
  let forcar=false;
  const ler=()=>({cliente:$("#rv-cliente").value,servico:$("#rv-servico").value,pro:$("#rv-pro").value,data:$("#rv-data").value,hora:$("#rv-hora").value,sala:$("#rv-sala").value,origem:$("#rv-origem").value,preco:+$("#rv-preco").value||0,obs:$("#rv-obs").value.trim()});
  function fillPros(){const sv=$("#rv-servico").value,cur=$("#rv-pro").value||r.pro;const ok=db.pros.filter(p=>p.ativo&&p.servicos.includes(sv));const lista=ok.length?ok:db.pros;$("#rv-pro").innerHTML=lista.map(p=>`<option value="${p.id}" ${p.id===cur?"selected":""}>${esc(p.nome)}</option>`).join("");}
  function mostrarAviso(av,v,bloqueio){const el=$("#rv-aviso");if(!av.length){el.hidden=true;return}const sug=sugerir(v,id);el.hidden=false;el.innerHTML=`<b>Atenção:</b> ${av.map(esc).join(" ")}${sug&&sug!==v.hora?` <button type="button" class="btn sm" id="rv-sug" style="margin-left:6px">Usar ${sug}</button>`:""}${bloqueio?`<br><span style="opacity:.8">Clique em Salvar de novo para reservar mesmo assim.</span>`:""}`;const b=$("#rv-sug");if(b)b.onclick=()=>{$("#rv-hora").value=sug;forcar=false;checar()};}
  function checar(){forcar=false;const v=ler();if(!v.data||!v.hora)return;v.cliente=v.cliente==="__novo"?"":v.cliente;mostrarAviso(conflitos(v,id),v,false);}
  fillPros();
  $("#rv-cliente").onchange=()=>{$("#rv-novo").hidden=$("#rv-cliente").value!=="__novo";checar()};
  $("#rv-servico").onchange=()=>{const s=S($("#rv-servico").value);$("#rv-sala").value=s.sala;$("#rv-preco").value=s.preco;fillPros();checar()};
  ["#rv-pro","#rv-data","#rv-hora","#rv-sala"].forEach(s=>$(s).onchange=checar);
  document.querySelectorAll(".statusrow button").forEach(b=>b.onclick=()=>{r.status=b.dataset.st;save();document.querySelectorAll(".statusrow button").forEach(x=>x.classList.toggle("on",x===b));toast("Status: "+STATUS[r.status]);render()});
  if(id)checar();else checar();
}

/* ---------- modal genérico ---------- */
function modal(titulo,sub,campos,onSave,onDel,delTxt){
  $("#layer").innerHTML=`<div class="scrim" data-act="fecharfora"><form class="modal" id="mform" role="dialog" aria-label="${esc(titulo)}" novalidate>
   <header><div><h3>${titulo}</h3><p>${sub}</p></div><button type="button" class="x" data-act="fechar" aria-label="Fechar">×</button></header>
   <div class="form">${campos}<div id="m-err" class="warn" hidden></div></div>
   <footer>${onDel?`<button type="button" class="btn danger ghost" id="m-del">${delTxt||"Excluir"}</button>`:""}<div class="r"><button type="button" class="btn" data-act="fechar">Fechar</button><button class="btn pri" type="submit">Salvar</button></div></footer>
  </form></div>`;
  const f=$("#mform");
  f.addEventListener("submit",e=>{e.preventDefault();const r=onSave();if(r===false)return;if(r&&!/salv|cria|atualiz/i.test(r)){const el=$("#m-err");el.hidden=false;el.textContent=r;return}save();fechar();render();toast(r||"Salvo")});
  if(onDel){let armado=false;$("#m-del").onclick=()=>{if(!armado){armado=true;$("#m-del").textContent="Toque de novo para confirmar";return}const m=onDel();save();fechar();render();toast(m)}}
  setTimeout(()=>{const i=f.querySelector("input:not([type=checkbox]):not([type=radio]),select");if(i&&!/rv-/.test(i.id))i.focus()},30);
}
function fechar(){$("#layer").innerHTML=""}
document.addEventListener("keydown",e=>{if(e.key==="Escape")fechar()});

/* ---------- App ---------- */
function vApp(){
  const A=MODO==="local"?APP_EXEMPLO:(db.app||{});const temApk=!!A.android;
  return `<div class="head"><div><h1>Baixar o app</h1><p>O aplicativo do cliente com a marca ${esc(db.marca.nome)}: reservas, preparo da visita e rituais em casa.</p></div></div>
  <section class="apphero"><div style="position:relative;z-index:1"><div class="lbl" style="color:inherit;opacity:.7">${esc(db.marca.nome)} para clientes</div><h2>O spa continua no bolso de quem sai daqui.</h2><p>Envie o link para clientes e equipe testarem o protótipo. As reservas feitas no app aparecem aqui com a origem “App”.</p></div>${A.icone?`<img src="${esc(A.icone)}" alt="Ícone do app">`:""}</section>
  <div class="stores">
    <div class="store">
      <h3><svg class="os" viewBox="0 0 24 24" fill="var(--folha)"><path d="M17.6 9.48l1.84-3.18a.38.38 0 0 0-.66-.38l-1.86 3.22a11.4 11.4 0 0 0-9.84 0L5.22 5.92a.38.38 0 0 0-.66.38L6.4 9.48A10.8 10.8 0 0 0 1 18h22a10.8 10.8 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/></svg>Android</h3>
      <dl class="meta num"><dt>Versão</dt><dd>${esc(A.versao||"—")}</dd><dt>Tamanho</dt><dd>${esc(A.tamanho||"—")}</dd><dt>Gerado em</dt><dd>${esc(A.data||"—")}</dd><dt>Requer</dt><dd>Android 5.0 ou mais novo</dd></dl>
      ${temApk?`<a class="btn pri" href="${esc(A.android)}" download style="align-self:flex-start">Baixar APK</a>`:'<div class="info" style="margin:0">O app Android desta empresa ainda está sendo preparado. Ele aparece aqui quando estiver pronto.</div>'}
      <div class="lbl">Como instalar</div>
      <ol class="steps"><li>Baixe o arquivo no celular Android ou envie para ele.</li><li>Abra o arquivo e permita “instalar apps desconhecidos” quando o Android pedir.</li><li>Se o Play Protect avisar, toque em “Mais detalhes” e depois em “Instalar mesmo assim”. É um protótipo ainda fora da Play Store.</li></ol>
    </div>
    ${(()=>{const st=A.ios||"em_breve",tf=st==="testflight",loja=st==="app_store";return `<div class="store ${loja?"":"soon"}">
      <h3><svg class="os" viewBox="0 0 24 24" fill="${loja?"var(--folha)":"var(--tinta2)"}"><path d="M16.4 12.7c0-2.4 2-3.6 2.1-3.7a4.5 4.5 0 0 0-3.6-1.9c-1.5-.2-3 .9-3.7.9-.8 0-2-.9-3.2-.9a4.8 4.8 0 0 0-4 2.4c-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4a10 10 0 0 0 1.4-2.8 4.3 4.3 0 0 1-2.5-3.8zM14 5.6A4.3 4.3 0 0 0 15 2.5a4.4 4.4 0 0 0-2.9 1.5 4.1 4.1 0 0 0-1 3 3.6 3.6 0 0 0 2.9-1.4z"/></svg>iPhone</h3>
      ${loja?`<p style="margin:0;font-size:13px;color:var(--tinta2)">Disponível na App Store${A.iosNome?` como “${esc(A.iosNome)}”`:""}.</p><span class="pill st-confirmada" style="align-self:flex-start">Na App Store</span>${A.iosLink?`<a class="btn pri" href="${esc(A.iosLink)}" target="_blank" rel="noopener" style="align-self:flex-start">Abrir na App Store</a>`:""}`
      :tf?`<p style="margin:0;font-size:13px;color:var(--tinta2)">Em teste pelo TestFlight${A.iosBuild?`, build ${esc(A.iosBuild)}`:""}${A.iosData?` de ${esc(A.iosData)}`:""}. Ainda não está na App Store.</p>
      <span class="pill st-checkin" style="align-self:flex-start">Em teste (TestFlight)</span>
      ${A.iosLink?`<a class="btn pri" href="${esc(A.iosLink)}" target="_blank" rel="noopener" style="align-self:flex-start">Entrar no teste</a><div class="lbl">Como instalar</div><ol class="steps"><li>Instale o app TestFlight da Apple no iPhone.</li><li>Abra o link acima no iPhone e toque em “Aceitar” e depois em “Instalar”.</li></ol>`
        :`<div class="lbl">Quem pode testar</div><p style="margin:0;font-size:12.5px;color:var(--tinta2)">Por enquanto só a equipe cadastrada no App Store Connect. O link de convite aparece aqui quando o teste for aberto para clientes.</p>`}`
      :`<p style="margin:0;font-size:13px;color:var(--tinta2)">Em breve na App Store. A versão para iPhone depende de uma conta de desenvolvedor Apple e da revisão da loja.</p><span class="pill st-pendente" style="align-self:flex-start">Em breve</span>`}
      ${loja?"":`<div class="lbl">Enquanto isso</div><p style="margin:0;font-size:12.5px;color:var(--tinta2)">Clientes com iPhone podem usar a versão web do app no navegador, com a mesma experiência.</p>`}
    </div>`})()}
  </div>`;
}

/* ---------- Ajustes ---------- */
function vAjustes(){
  return `<div class="head"><div><h1>Ajustes</h1><p>Funcionamento da casa e salas de atendimento.</p></div></div>
  <div class="grid g-2">
   <div class="panel"><h2>Horário da agenda</h2><div class="pb"><div class="form" style="padding:0">
     <label>Abre às<input class="f" type="time" id="cf-abre" value="${db.cfg.abre}"></label>
     <label>Fecha às<input class="f" type="time" id="cf-fecha" value="${db.cfg.fecha}"></label>
     <label>Intervalo entre horários<select class="f" id="cf-passo">${[10,15,30].map(n=>`<option value="${n}" ${db.cfg.passo===n?"selected":""}>${n} minutos</option>`).join("")}</select></label>
     <div class="full"><button class="btn pri" data-act="salvarcfg">Salvar horário</button></div>
   </div></div></div>
   <div class="panel"><h2>Salas</h2><div class="pb">
     <div class="tags" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${db.salas.map((s,i)=>`<span class="tag" style="font-size:12.5px;padding:5px 10px">${esc(s)} <button class="x" style="font-size:14px;padding:0 0 0 4px" data-act="delsala" data-i="${i}" aria-label="Remover ${esc(s)}">×</button></span>`).join("")}</div>
     <div class="copy"><input class="f" id="nova-sala" placeholder="Nome da nova sala"><button class="btn" data-act="addsala">Adicionar</button></div>
   </div></div>
   <div style="grid-column:1/-1">${WA.editor(db.cfg).replace('</div></div></div>',`<div class="full" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn pri" data-act="salvarwa">Salvar WhatsApp</button>${WA.linkAgendar(db.cfg,db.marca)?`<a class="btn" target="_blank" rel="noopener" href="${esc(WA.linkAgendar(db.cfg,db.marca))}">Testar link de agendamento</a><button class="btn" data-act="copiarwa">Copiar link para Instagram e site</button>`:""}</div></div></div></div>`)}</div>
   ${MODO==="local"?`<div class="panel"><h2>Dados de exemplo</h2><div class="pb"><p style="margin:0 0 12px;color:var(--tinta2);font-size:13px">Este protótipo guarda tudo só neste navegador. Restaurar apaga as suas alterações e gera reservas de exemplo a partir de hoje.</p><button class="btn danger" data-act="reset">Restaurar exemplos</button></div></div>`:(!db.servicos.length&&!db.reservas.length?`<div class="panel"><h2>Começar com exemplos</h2><div class="pb"><p style="margin:0 0 12px;color:var(--tinta2);font-size:13px">A empresa ainda não tem cadastros. Carregue serviços, profissionais, clientes e reservas de exemplo para testar, e depois edite ou apague.</p><button class="btn" data-act="exemplos">Carregar exemplos</button></div></div>`:"")}
  </div>`;
}

/* ---------- Marca (white-label) ---------- */
let draft=null;
const FONTES_T=["Cormorant Garamond","Playfair Display","DM Serif Display","Fraunces","Lora","Marcellus","Montserrat","Poppins"];
const FONTES_X=["Montserrat","Inter","Lato","Nunito Sans","Work Sans","Source Sans 3","Poppins","DM Sans"];
const PRESETS=[
 {n:"Musgo e linho",primaria:"#28442d",destaque:"#7d8a55",fundo:"#efe9e0",fTitulo:"Cormorant Garamond",fTexto:"Montserrat"},
 {n:"Bruma azul",primaria:"#2f4858",destaque:"#c08b6f",fundo:"#eef0f0",fTitulo:"Playfair Display",fTexto:"Inter"},
 {n:"Terracota",primaria:"#7a3424",destaque:"#c9973a",fundo:"#f4ece3",fTitulo:"DM Serif Display",fTexto:"Work Sans"},
 {n:"Ameixa",primaria:"#4a2c48",destaque:"#a0798c",fundo:"#f1ecee",fTitulo:"Fraunces",fTexto:"Nunito Sans"},
 {n:"Areia clara",primaria:"#d8c7ad",destaque:"#8a6a3d",fundo:"#faf7f2",fTitulo:"Marcellus",fTexto:"Lato"},
 {n:"Grafite",primaria:"#2e3033",destaque:"#4f8a83",fundo:"#f2f2f0",fTitulo:"Lora",fTexto:"DM Sans"}
];
const hex2rgb=h=>{h=h.replace("#","");if(h.length===3)h=h.split("").map(x=>x+x).join("");const n=parseInt(h,16);return[n>>16&255,n>>8&255,n&255]};
const rgb2hex=a=>"#"+a.map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,"0")).join("");
const mix=(a,b,t)=>{const x=hex2rgb(a),y=hex2rgb(b);return rgb2hex(x.map((v,i)=>v+(y[i]-v)*t))};
const lum=h=>{const[r,g,b]=hex2rgb(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b};
const sobre=h=>lum(h)>.42?"#24271f":"#f6f2ec";
const carregadas=new Set(["Cormorant Garamond","Montserrat"]);
function ensureFont(f){if(!f||carregadas.has(f))return;carregadas.add(f);const l=document.createElement("link");l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family="+encodeURIComponent(f).replace(/%20/g,"+")+":wght@400;500;600&display=swap";document.head.appendChild(l)}
function logoSrc(m){return m.logoSym?SYM:m.logo}
function logoHtml(m,cls){const src=logoSrc(m);if(!src)return `<div class="${cls||""}" aria-hidden="true" style="width:34px;height:34px;border-radius:9px;display:grid;place-items:center;border:1.5px solid currentColor;font:600 14px var(--display);flex:none">${esc(ini(m.nome||m.empresa||"?"))}</div>`;
  return m.logoMono?`<div class="sym" aria-hidden="true" style="--logo:url('${src}')"></div>`:`<img src="${src}" alt="">`}
function applyBrand(m){
  const r=document.documentElement.style,p=m.primaria,f=m.fundo;
  const set=(k,v)=>r.setProperty(k,v);
  set("--musgo",p);set("--musgo2",lum(p)>.42?mix(p,"#000000",.12):mix(p,"#000000",.22));set("--sobre",sobre(p));
  set("--folha",m.destaque);set("--salvia",mix(m.destaque,"#ffffff",.45));
  set("--fundo",f);set("--papel",mix(f,"#ffffff",.55));set("--branco",mix(f,"#ffffff",.85));set("--linho",mix(mix(f,p,.06),"#000000",.03));set("--linha",mix(f,"#2b2e25",.11));
  ensureFont(m.fTitulo);ensureFont(m.fTexto);
  set("--display",`"${m.fTitulo}",Georgia,"Times New Roman",serif`);set("--texto",`"${m.fTexto}","Helvetica Neue",Arial,sans-serif`);
  const src=logoSrc(m);set("--logo",src?`url('${src}')`:"none");
  document.title=(m.nome||m.empresa)+" · Backoffice";
  const tc=document.querySelector('meta[name="theme-color"]');if(tc)tc.content=p;
}
function vMarca(){
  if(!draft)draft={marca:{...db.marca},cats:db.cats.map(c=>({...c}))};
  const m=draft.marca;
  return `<div class="head"><div><h1>Marca e identidade</h1><p>Cada empresa usa o sistema com o próprio nome, logo, cores e fontes. As mudanças aparecem na hora, e valem para todos quando você salva.</p></div>
   <div class="tools"><button class="btn" data-act="descartarmarca">Descartar</button><button class="btn pri" data-act="salvarmarca">Salvar marca</button></div></div>
  <div class="marca">
   <div class="grid">
    <div class="panel"><h2>Empresa</h2><div class="pb"><div class="form" style="padding:0">
      <label class="full">Razão ou nome da empresa<input class="f" id="mk-empresa" value="${esc(m.empresa)}"></label>
      <label>Nome exibido no sistema<input class="f" id="mk-nome" value="${esc(m.nome)}" maxlength="24"></label>
      <label>Subtítulo<input class="f" id="mk-sub" value="${esc(m.sub)}" maxlength="28"></label>
    </div></div></div>
    <div class="panel"><h2>Logo</h2><div class="pb" style="display:flex;flex-direction:column;gap:12px">
      <label class="drop" id="mk-drop" for="mk-file"><div class="prev">${logoHtml(m)}</div><div style="min-width:0"><b style="font-weight:600">Enviar logo</b><div style="font-size:12.5px;color:var(--tinta2)">PNG ou SVG com fundo transparente funciona melhor. Arraste o arquivo para cá ou clique.</div></div></label>
      <input type="file" id="mk-file" accept="image/png,image/svg+xml,image/webp,image/jpeg" hidden>
      <div id="mk-logoerr" class="warn" hidden></div>
      <label class="chk" style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" id="mk-mono" ${m.logoMono?"checked":""}>Pintar o logo na cor do texto da barra (bom para símbolos de uma cor)</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${m.logoSym?"":`<button class="btn sm" data-act="logosym">Usar o símbolo de exemplo</button>`}<button class="btn sm ghost" data-act="logonone">Sem logo (só iniciais)</button></div>
    </div></div>
    <div class="panel"><h2>Cores</h2><div class="pb" style="display:flex;flex-direction:column;gap:14px">
      <div class="swatches">
        <label class="sw">Principal<input type="color" id="mk-primaria" value="${m.primaria}"><span class="num">${m.primaria}</span></label>
        <label class="sw">Destaque<input type="color" id="mk-destaque" value="${m.destaque}"><span class="num">${m.destaque}</span></label>
        <label class="sw">Fundo<input type="color" id="mk-fundo" value="${m.fundo}"><span class="num">${m.fundo}</span></label>
      </div>
      ${lum(m.fundo)<.55?'<div class="warn">Esse fundo é escuro demais para o texto ficar legível. Prefira um tom claro.</div>':""}
      <div class="lbl">Paletas prontas</div>
      <div class="presets">${PRESETS.map((p,i)=>`<button class="preset" data-act="preset" data-i="${i}"><div class="bar"><i style="background:${p.primaria}"></i><i style="background:${p.destaque}"></i><i style="background:${p.fundo}"></i></div><span>${p.n}</span></button>`).join("")}</div>
    </div></div>
    <div class="panel"><h2>Tipografia</h2><div class="pb"><div class="form" style="padding:0">
      <label>Fonte dos títulos<select class="f" id="mk-ft">${FONTES_T.map(f=>`<option ${m.fTitulo===f?"selected":""}>${f}</option>`).join("")}</select></label>
      <label>Fonte do texto<select class="f" id="mk-fx">${FONTES_X.map(f=>`<option ${m.fTexto===f?"selected":""}>${f}</option>`).join("")}</select></label>
    </div></div></div>
   </div>
   <div class="grid" style="position:sticky;top:16px">
    <div class="panel"><h2>Pré-visualização</h2><div class="pb">
      <div class="preview"><div class="pside"><div style="display:flex;align-items:center;gap:6px;transform:scale(.8);transform-origin:left">${logoHtml(m)}<b style="font:500 18px var(--display)">${esc(m.nome)}</b></div><i></i><i style="width:70%"></i><i style="width:80%"></i><i style="width:60%"></i></div>
      <div class="pmain"><div class="lbl">Hoje</div><h4>${fmtLonga(today())}</h4><div style="display:flex;gap:8px;flex-wrap:wrap">${pill("confirmada")}${pill("pendente")}</div>
      <div class="row" style="cursor:default"><div class="t num">10:30</div><div class="bar" style="background:${draft.cats[0]?.c||m.destaque}"></div><div style="min-width:0"><div class="n">Cliente de exemplo</div><div class="d">${esc(db.servicos[0]?.nome||"Serviço")}</div></div><span></span></div>
      <div><button class="btn pri sm" type="button">+ Nova reserva</button></div></div></div>
    </div></div>
    <div class="panel"><h2>Categorias de serviço</h2><div class="pb">
      <p style="margin:0 0 12px;font-size:12.5px;color:var(--tinta2)">Agrupam os serviços e colorem a agenda. No Vivarium são os quatro pilares da marca.</p>
      <div class="cats">${draft.cats.map((c,i)=>{const usada=db.servicos.some(s=>s.pilar===c.id);return `<div class="c"><input type="color" class="mk-catc" data-i="${i}" value="${c.c}" aria-label="Cor de ${esc(c.n)}"><input class="f mk-catn" data-i="${i}" value="${esc(c.n)}" aria-label="Nome da categoria"><button class="btn sm ghost" data-act="delcat" data-i="${i}" ${usada?'disabled title="Há serviços nessa categoria"':""}>Remover</button></div>`}).join("")}</div>
      <button class="btn sm" style="margin-top:10px" data-act="addcat">+ Categoria</button>
    </div></div>
   </div>
  </div>`;
}
function marcaLive(rerender){applyBrand(draft.marca);buildCats(draft.cats);if(rerender){const y=window.scrollY;render();window.scrollTo(0,y)}else renderNav();}
function afterMarca(){
  const m=draft.marca;
  const bind=(id,k,re)=>{const el=$(id);el.addEventListener("input",()=>{m[k]=el.value;if(el.type==="color"){const sp=el.parentElement.querySelector("span");if(sp)sp.textContent=el.value}marcaLive(false)});if(re)el.addEventListener("change",()=>marcaLive(true))};
  bind("#mk-empresa","empresa");bind("#mk-nome","nome");bind("#mk-sub","sub");
  bind("#mk-primaria","primaria",1);bind("#mk-destaque","destaque",1);bind("#mk-fundo","fundo",1);
  $("#mk-ft").onchange=e=>{m.fTitulo=e.target.value;marcaLive(true)};$("#mk-fx").onchange=e=>{m.fTexto=e.target.value;marcaLive(true)};
  $("#mk-mono").onchange=e=>{m.logoMono=e.target.checked;marcaLive(true)};
  document.querySelectorAll(".mk-catn").forEach(el=>el.oninput=()=>{draft.cats[+el.dataset.i].n=el.value;buildCats(draft.cats)});
  document.querySelectorAll(".mk-catc").forEach(el=>el.onchange=()=>{draft.cats[+el.dataset.i].c=el.value;marcaLive(true)});
  const drop=$("#mk-drop"),file=$("#mk-file");
  file.onchange=()=>file.files[0]&&lerLogo(file.files[0]);
  ["dragover","dragenter"].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.add("over")}));
  ["dragleave","drop"].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.remove("over")}));
  drop.addEventListener("drop",e=>{const f=e.dataTransfer.files[0];if(f)lerLogo(f)});
}
function lerLogo(f){
  const err=t=>{const el=$("#mk-logoerr");el.hidden=false;el.textContent=t};
  if(!/^image\/(png|svg\+xml|webp|jpeg)$/.test(f.type))return err("Envie uma imagem PNG, SVG, WebP ou JPG.");
  const rd=new FileReader();
  rd.onload=()=>{
    const fim=src=>{draft.marca.logo=src;draft.marca.logoSym=false;if(f.type==="image/jpeg")draft.marca.logoMono=false;marcaLive(true);toast("Logo carregado. Salve para manter.")};
    if(f.type==="image/svg+xml"){if(rd.result.length>300000)return err("Esse SVG passa de 200 KB. Exporte uma versão mais simples.");return fim(rd.result)}
    const img=new Image();img.onload=()=>{const k=Math.min(1,480/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext("2d").drawImage(img,0,0,c.width,c.height);fim(c.toDataURL("image/png"))};
    img.onerror=()=>err("Não consegui ler essa imagem. Tente outro arquivo.");img.src=rd.result;
  };
  rd.readAsDataURL(f);
}
function acaoMarca(a,el){
  const m=draft&&draft.marca;if(!m)return false;
  if(a==="preset"){Object.assign(m,PRESETS[+el.dataset.i]);delete m.n;marcaLive(true);return true}
  if(a==="logosym"){m.logoSym=true;m.logoMono=true;marcaLive(true);return true}
  if(a==="logonone"){m.logoSym=false;m.logo="";marcaLive(true);return true}
  if(a==="addcat"){draft.cats.push({id:uid(),n:"Nova categoria",c:m.destaque});marcaLive(true);return true}
  if(a==="delcat"){draft.cats.splice(+el.dataset.i,1);marcaLive(true);return true}
  if(a==="descartarmarca"){draft=null;render();toast("Alterações descartadas");return true}
  if(a==="salvarmarca"){if(!draft.cats.length){toast("Mantenha ao menos uma categoria");return true}draft.cats.forEach(c=>c.n=c.n.trim()||"Sem nome");db.marca={...m};db.cats=draft.cats.map(c=>({...c}));
    if(MODO==="local"){try{localStorage.setItem(KEY,JSON.stringify(db));}catch(e){toast("O logo é grande demais para guardar neste navegador. Use um arquivo menor.");return true}}else save();
    draft=null;render();toast("Marca salva");return true}
  return false;
}

const VIEWS={marca:vMarca,painel:vPainel,agenda:vAgenda,reservas:vReservas,clientes:vClientes,servicos:vServicos,profissionais:vPros,app:vApp,ajustes:vAjustes};

/* ---------- ações ---------- */
let resetArmado=false;
document.addEventListener("click",e=>{
  const el=e.target.closest("[data-act]");if(!el)return;
  const a=el.dataset.act,id=el.dataset.id;
  if(a==="fecharfora"){if(e.target===el)fechar();return}
  if(a==="fechar"){fechar();return}
  if(acaoMarca(a,el))return;
  if(window.Nuvem&&Nuvem.acao(a,el,e))return;
  if(a==="nova"){e.preventDefault();abrirReserva(null,el.dataset.cliente?{cliente:el.dataset.cliente,data:today()}:{});return}
  if(a==="abrir"){abrirReserva(id);return}
  if(a==="confirmar"){e.stopPropagation();const r=db.reservas.find(x=>x.id===id);r.status="confirmada";save();render();toast("Reserva confirmada");return}
  if(a==="verpend"){ui.fStatus="pendente";ui.fPeriodo="proximas";keepUi();return}
  if(a==="nav"){const n=+el.dataset.n*(ui.vista==="semana"?7:1);ui.dia=addDays(ui.dia,n);render();return}
  if(a==="hoje"){ui.dia=today();render();return}
  if(a==="vista"){ui.vista=el.dataset.v;keepUi();render();return}
  if(a==="irdia"){ui.dia=el.dataset.d;ui.vista="dia";keepUi();render();return}
  if(a==="periodo"){ui.fPeriodo=el.dataset.v;keepUi();render();return}
  if(a==="cliente"){abrirCliente(id);return}
  if(a==="novocliente"){editCliente(null);return}
  if(a==="editcliente"){editCliente(id);return}
  if(a==="editservico"){editServico(id);return}
  if(a==="editpro"){editPro(id);return}
  if(a==="salvarcfg"){const ab=$("#cf-abre").value,fe=$("#cf-fecha").value;if(!ab||!fe||toMin(fe)<=toMin(ab)){toast("O horário de fechamento precisa ser depois da abertura");return}db.cfg.abre=ab;db.cfg.fecha=fe;db.cfg.passo=+$("#cf-passo").value;save();toast("Horário salvo");return}
  if(a==="salvarwa"){const v=WA.lerEditor();if(v.wa_numero&&!WA.numero(v.wa_numero)){toast("Confira o número do WhatsApp do spa, com DDD");return}Object.assign(db.cfg,v);save();render();toast("WhatsApp salvo");return}
  if(a==="copiarwa"){const l=WA.linkAgendar(db.cfg,db.marca);(navigator.clipboard?navigator.clipboard.writeText(l):Promise.reject()).then(()=>toast("Link copiado"),()=>prompt("Copie o link:",l));return}
  if(a==="addsala"){const v=$("#nova-sala").value.trim();if(!v)return;db.salas.push(v);save();render();toast("Sala adicionada");return}
  if(a==="delsala"){const s=db.salas[+el.dataset.i];if(db.servicos.some(x=>x.sala===s)){toast(`${s} é a sala padrão de um serviço. Troque no serviço antes.`);return}db.salas.splice(+el.dataset.i,1);save();render();return}
  if(a==="exemplos"){const ex=seed();["servicos","pros","clientes","reservas"].forEach(k=>db[k]=ex[k]);db.cats=ex.cats;db.salas=ex.salas;Nuvem.uuidificar(db);buildCats();save();render();toast("Exemplos carregados");return}
  if(a==="reset"){if(!resetArmado){resetArmado=true;el.textContent="Toque de novo para apagar e restaurar";return}resetArmado=false;db=normalizar(seed());save();ui.dia=today();render();toast("Exemplos restaurados");return}
});
document.addEventListener("input",e=>{
  if(e.target.id==="busca"){ui.busca=e.target.value;const p=e.target.selectionStart;render();const i=$("#busca");i.focus();i.setSelectionRange(p,p)}
  if(e.target.id==="cbusca"){ui.cBusca=e.target.value;const p=e.target.selectionStart;render();const i=$("#cbusca");i.focus();i.setSelectionRange(p,p)}
});
document.addEventListener("change",e=>{if(e.target.id==="fstatus"){ui.fStatus=e.target.value;keepUi();render()}});

/* ---------- início ---------- */
if(MODO==="local"){try{db=JSON.parse(localStorage.getItem(KEY))}catch(e){}if(!db||!db.reservas)db=seed();db=normalizar(db);save();render();}
else Nuvem.iniciar();

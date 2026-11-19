/* Camada de nuvem: login, empresas, perfis e sincronização com o Supabase.
   Só é usada quando config.js traz supabaseUrl e supabaseAnonKey. */
(function(){
if(!(window.CONFIG&&CONFIG.supabaseUrl&&CONFIG.supabaseAnonKey))return;
const sb=supabase.createClient(CONFIG.supabaseUrl,CONFIG.supabaseAnonKey);
const PAPEIS={dono:"Dono",gestor:"Gestor",recepcao:"Recepção",profissional:"Profissional"};
const COLS={
  cats:["id","n","c","ordem"],
  servicos:["id","nome","pilar","dur","preco","intervalo","sala","ativo","app","descricao"],
  pros:["id","nome","funcao","cor","dias","ini","fim","servicos","ativo"],
  clientes:["id","nome","tel","email","origem","desde","pref","obs","whatsapp_ok"],
  reservas:["id","cliente","servico","pro","sala","data","hora","status","origem","preco","obs","lembrete_enviado_em"]
};
const TAB={cats:"categorias",servicos:"servicos",pros:"profissionais",clientes:"clientes",reservas:"reservas"};
const ORDEM=["cats","servicos","pros","clientes","reservas"];
const LS="bo-empresa";
const ctx={user:null,admin:false,membros:[],empresa:null,papel:null,proId:null,snap:{},empSnap:"",timer:null,salvando:false,pendente:false,estado:"ok",livre:false};

const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const linha=(k,r)=>{const o={};COLS[k].forEach(c=>{let v=r[c];if(v===undefined)v=null;if(c==="preco")v=Number(v||0);o[c]=v});return o};
const papelEf=()=>ctx.admin&&!ctx.papel?"admin":ctx.papel;
const gere=()=>["admin","dono","gestor"].includes(papelEf());
const opera=()=>gere()||papelEf()==="recepcao";

async function todos(fn){let out=[],i=0;for(;;){const{data,error}=await fn().range(i,i+999);if(error)throw error;out=out.concat(data);if(data.length<1000)break;i+=1000}return out}

/* ---------- telas de acesso ---------- */
function telaAcesso(modo,msg){
  document.body.classList.add("sem-app");
  const titulos={entrar:"Entrar",criar:"Criar conta",senha:"Recuperar senha",nova:"Nova senha"};
  const campos={
    entrar:`<label>E-mail<input class="f" id="au-email" type="email" autocomplete="email" required></label><label>Senha<input class="f" id="au-senha" type="password" autocomplete="current-password" required></label>`,
    criar:`<label>E-mail<input class="f" id="au-email" type="email" autocomplete="email" required></label><label>Senha (mínimo 8 caracteres)<input class="f" id="au-senha" type="password" minlength="8" autocomplete="new-password" required></label><p class="au-nota">Use o e-mail em que você recebeu o convite da sua empresa. Você entra direto nela.</p>`,
    senha:`<label>E-mail da conta<input class="f" id="au-email" type="email" autocomplete="email" required></label>`,
    nova:`<label>Nova senha (mínimo 8 caracteres)<input class="f" id="au-senha" type="password" minlength="8" autocomplete="new-password" required></label>`
  };
  const links={entrar:`<a href="#" data-au="criar">Criar conta</a><a href="#" data-au="senha">Esqueci a senha</a>`,criar:`<a href="#" data-au="entrar">Já tenho conta</a>`,senha:`<a href="#" data-au="entrar">Voltar</a>`,nova:""};
  $("#acesso").innerHTML=`<form class="au" id="au-form" novalidate>
    <div class="au-marca"><div class="sym" aria-hidden="true" style="--logo:url('${CONFIG.logoAcesso||SYM}')"></div><div><b>${esc(CONFIG.nomePlataforma||"Backoffice")}</b><small>Agendamentos</small></div></div>
    <h1>${titulos[modo]}</h1>${campos[modo]}
    <div id="au-msg" class="${msg&&msg.ok?"info":"warn"}" ${msg?"":"hidden"}>${msg?esc(msg.t):""}</div>
    <button class="btn pri" type="submit" id="au-ok">${titulos[modo]==="Entrar"?"Entrar":titulos[modo]==="Criar conta"?"Criar conta":titulos[modo]==="Nova senha"?"Salvar senha":"Enviar link"}</button>
    <div class="au-links">${links[modo]}</div></form>`;
  $("#acesso").hidden=false;
  $("#acesso").querySelectorAll("[data-au]").forEach(a=>a.onclick=e=>{e.preventDefault();telaAcesso(a.dataset.au)});
  const f=$("#au-form");setTimeout(()=>{const i=f.querySelector("input");if(i)i.focus()},30);
  f.onsubmit=async e=>{e.preventDefault();const btn=$("#au-ok");btn.disabled=true;
    const em=($("#au-email")||{}).value,se=($("#au-senha")||{}).value;let r,ok;
    const erro=t=>{const m=$("#au-msg");m.hidden=false;m.className="warn";m.textContent=t;btn.disabled=false};
    try{
      if(modo==="entrar"){r=await sb.auth.signInWithPassword({email:em,password:se});if(r.error)return erro(traduz(r.error));return}
      if(modo==="criar"){if(!se||se.length<8)return erro("A senha precisa ter pelo menos 8 caracteres.");r=await sb.auth.signUp({email:em,password:se,options:{emailRedirectTo:location.origin+location.pathname}});if(r.error)return erro(traduz(r.error));
        if(!r.data.session)return telaAcesso("entrar",{ok:1,t:"Conta criada. Confirme pelo link que enviamos para "+em+" e depois entre aqui."});return}
      if(modo==="senha"){r=await sb.auth.resetPasswordForEmail(em,{redirectTo:location.origin+location.pathname});if(r.error)return erro(traduz(r.error));return telaAcesso("entrar",{ok:1,t:"Se existir uma conta com esse e-mail, enviamos um link para criar uma nova senha."})}
      if(modo==="nova"){if(!se||se.length<8)return erro("A senha precisa ter pelo menos 8 caracteres.");r=await sb.auth.updateUser({password:se});if(r.error)return erro(traduz(r.error));toast("Senha alterada");$("#acesso").hidden=true;document.body.classList.remove("sem-app");return carregarContexto()}
    }catch(x){erro("Sem conexão com o servidor. Verifique a internet e tente de novo.")}
  };
}
function traduz(e){const m=(e&&e.message)||"";
  if(/Invalid login/i.test(m))return "E-mail ou senha incorretos.";
  if(/not confirmed/i.test(m))return "Confirme o e-mail pelo link que enviamos antes de entrar.";
  if(/already registered|already exists/i.test(m))return "Já existe uma conta com esse e-mail. Use “Já tenho conta”.";
  if(/rate limit|too many/i.test(m))return "Muitas tentativas seguidas. Aguarde alguns minutos.";
  if(/row-level security|permission/i.test(m))return "Seu perfil não tem permissão para essa alteração.";
  if(/Password should/i.test(m))return "A senha precisa ter pelo menos 8 caracteres.";
  return m||"Algo deu errado. Tente de novo.";}

function telaAviso(titulo,texto,extra){
  document.body.classList.add("sem-app");
  $("#acesso").hidden=false;
  $("#acesso").innerHTML=`<div class="au"><div class="au-marca"><div class="sym" aria-hidden="true" style="--logo:url('${CONFIG.logoAcesso||SYM}')"></div><div><b>${esc(CONFIG.nomePlataforma||"Backoffice")}</b><small>${esc(ctx.user?ctx.user.email:"")}</small></div></div><h1>${titulo}</h1><p class="au-nota">${texto}</p>${extra||""}<div class="au-links"><a href="#" data-act="sair">Sair</a></div></div>`;
}

/* ---------- contexto ---------- */
async function carregarContexto(){
  const{data:{user}}=await sb.auth.getUser();ctx.user=user;
  if(!user)return telaAcesso("entrar");
  try{
    await sb.rpc("aceitar_convites");
    const[a,m,l]=await Promise.all([
      sb.from("admins_plataforma").select("user_id").eq("user_id",user.id).maybeSingle(),
      sb.from("membros").select("empresa_id,papel,profissional_id,empresas(id,nome,slug,ativa)").eq("user_id",user.id),
      sb.rpc("plataforma_livre")]);
    if(m.error)throw m.error;
    ctx.admin=!!(a.data);ctx.livre=!!l.data;
    ctx.membros=(m.data||[]).filter(x=>x.empresas);
    let lista=ctx.membros.map(x=>x.empresas);
    if(ctx.admin){const{data}=await sb.from("empresas").select("id,nome,slug,ativa").order("nome");ctx.todas=data||[];lista=ctx.todas}
    ctx.lista=lista;
    if(!lista.length){
      if(ctx.admin){db=normalizar({});ctx.empresa=null;mostrarApp();location.hash="plataforma";return render()}
      return telaAviso("Sem empresa vinculada",`A conta ${esc(user.email)} ainda não faz parte de nenhuma empresa. Peça ao gestor do seu spa um convite para este e-mail e entre de novo.`,
        ctx.livre?`<div class="info" style="margin:6px 0">Esta plataforma ainda não tem dono. Se você está instalando o sistema agora, assuma a administração.</div><button class="btn pri" data-act="reivindicar">Sou o dono da plataforma</button>`:"");
    }
    const salvo=lsGet(LS);const alvo=lista.find(e=>e.id===salvo)||lista[0];
    await abrirEmpresa(alvo.id);
  }catch(x){console.error(x);telaAviso("Não foi possível carregar",`O servidor respondeu: ${esc(traduz(x))}. Tente recarregar a página.`)}
}
function mostrarApp(){$("#acesso").hidden=true;document.body.classList.remove("sem-app")}

async function abrirEmpresa(id){
  const mem=ctx.membros.find(x=>x.empresa_id===id);
  ctx.papel=mem?mem.papel:null;ctx.proId=mem?mem.profissional_id:null;
  const{data:emp,error}=await sb.from("empresas").select("*").eq("id",id).single();
  if(error)throw error;
  if(!emp.ativa&&!ctx.admin)return telaAviso("Acesso suspenso",`O acesso de ${esc(emp.nome)} está pausado. Fale com o suporte da plataforma.`);
  const q=t=>()=>sb.from(t).select("*").eq("empresa_id",id);
  const desde=addDays(today(),-180);
  const[cats,servicos,pros,clientes,reservas]=await Promise.all([
    todos(()=>q("categorias")().order("ordem")),todos(q("servicos")),todos(q("profissionais")),todos(q("clientes")),
    todos(()=>q("reservas")().gte("data",desde))]);
  ctx.empresa=emp;lsSet(LS,id);
  const marca={...emp.marca};if(!marca.nome)marca.nome=emp.nome;if(!marca.empresa)marca.empresa=emp.nome;
  let prosV=pros;if(papelEf()==="profissional")prosV=pros.filter(p=>p.id===ctx.proId);
  db=normalizar({marca,cfg:emp.cfg,salas:emp.salas,app:emp.app,cats:cats.map(c=>({id:c.id,n:c.n,c:c.c,ordem:c.ordem})),
    servicos:servicos.map(s=>({...s,preco:Number(s.preco)})),pros:prosV,clientes,reservas:reservas.map(r=>({...r,preco:Number(r.preco)}))});
  if(!emp.marca||!Object.keys(emp.marca).length)db.marca.logoSym=false;
  tirarFoto();buildCats();applyBrand(db.marca);
  document.body.dataset.papel=papelEf();
  mostrarApp();if(!rotas().some(r=>r[0]===location.hash.slice(1)))location.hash="painel";render();
}
function tirarFoto(){ctx.snap={};ORDEM.forEach(k=>{const m=new Map();(db[k]||[]).forEach(r=>m.set(r.id,JSON.stringify(linha(k,r))));ctx.snap[k]=m});ctx.empSnap=empJson()}
const empJson=()=>JSON.stringify({marca:db.marca,cfg:db.cfg,salas:db.salas});

/* ---------- sincronização ---------- */
function agendar(){clearTimeout(ctx.timer);ctx.timer=setTimeout(sincronizar,350);estado("salvando")}
async function sincronizar(){
  if(!ctx.empresa||!db)return;
  if(ctx.salvando){ctx.pendente=true;return}
  ctx.salvando=true;
  const emp=ctx.empresa.id;
  try{
    const ups={},dels={};
    ORDEM.forEach(k=>{const old=ctx.snap[k]||new Map(),cur=new Map();(db[k]||[]).forEach(r=>{if(!r.id)r.id=uid();cur.set(r.id,JSON.stringify(linha(k,r)))});
      ups[k]=[...cur].filter(([id,j])=>old.get(id)!==j).map(([id,j])=>({...JSON.parse(j),empresa_id:emp}));
      dels[k]=[...old.keys()].filter(id=>!cur.has(id));});
    if(k_temEmp()&&gere()){const m={...db.marca};const{error}=await sb.from("empresas").update({marca:m,cfg:db.cfg,salas:db.salas}).eq("id",emp);if(error)throw error}
    for(const k of ORDEM){if(ups[k].length){const{error}=await sb.from(TAB[k]).upsert(ups[k]);if(error)throw error}}
    for(const k of ORDEM.slice().reverse()){if(dels[k].length){const{error}=await sb.from(TAB[k]).delete().in("id",dels[k]);if(error)throw error}}
    tirarFoto();estado("ok");
  }catch(x){console.error(x);estado("erro");toast("Não foi possível salvar: "+traduz(x));
    try{await abrirEmpresa(emp)}catch(y){}}
  finally{ctx.salvando=false;if(ctx.pendente){ctx.pendente=false;sincronizar()}}
}
const k_temEmp=()=>empJson()!==ctx.empSnap;
function estado(s){ctx.estado=s;const el=$("#sync");if(el){el.textContent={ok:"Tudo salvo",salvando:"Salvando…",erro:"Erro ao salvar"}[s];el.dataset.s=s}}
// atualiza com o que outras pessoas fizeram, sem atropelar edições em andamento
setInterval(()=>{if(document.hidden||!ctx.empresa||ctx.salvando||ctx.timer&&ctx.estado==="salvando"||$("#layer").innerHTML||rota()==="marca")return;abrirEmpresa(ctx.empresa.id).catch(()=>{})},90000);

/* ---------- navegação por perfil ---------- */
function rotasPerfil(base){
  const p=papelEf();let r=base.slice();
  const so=ks=>{const out=[];r.forEach(x=>{if(x[0]==="g"||ks.includes(x[0]))out.push(x)});return out.filter((x,i,a)=>!(x[0]==="g"&&(!a[i+1]||a[i+1][0]==="g")))};
  if(!ctx.empresa)r=[];
  else if(p==="recepcao")r=so(["painel","agenda","reservas","clientes","app"]);
  else if(p==="profissional")r=so(["painel","agenda","app"]);
  else{const i=r.findIndex(x=>x[0]==="ajustes");r.splice(i+1,0,["equipe","Equipe e acessos"])}
  if(ctx.admin)r=r.concat([["g","Plataforma"],["plataforma","Empresas"]]);
  return r;
}
function rodape(){
  const f=document.querySelector(".side .foot");if(!f)return;
  const lista=ctx.lista||[];
  f.innerHTML=`${lista.length>1?`<label class="emp-sel"><span>Empresa</span><select id="emp-sel" class="f">${lista.map(e=>`<option value="${e.id}" ${ctx.empresa&&e.id===ctx.empresa.id?"selected":""}>${esc(e.nome)}</option>`).join("")}</select></label>`:""}
   <div class="quem"><b>${esc(ctx.user?ctx.user.email:"")}</b><span>${ctx.papel?PAPEIS[ctx.papel]:ctx.admin?"Administrador da plataforma":""}</span></div>
   <div class="quem-acoes"><span id="sync" data-s="${ctx.estado}">${{ok:"Tudo salvo",salvando:"Salvando…",erro:"Erro ao salvar"}[ctx.estado]}</span><button class="btn sm ghost" data-act="sair">Sair</button></div>`;
  const s=$("#emp-sel");if(s)s.onchange=()=>{draft=null;abrirEmpresa(s.value).catch(x=>toast(traduz(x)))};
}

/* ---------- Equipe ---------- */
let equipeCache=null;
async function carregarEquipe(){
  const id=ctx.empresa.id;
  const[m,c]=await Promise.all([sb.from("membros").select("*").eq("empresa_id",id).order("criado_em"),sb.from("convites").select("*").eq("empresa_id",id).is("aceito_em",null).order("criado_em")]);
  equipeCache={m:m.data||[],c:c.data||[],id};if(rota()==="equipe")render();
}
function vEquipe(){
  if(!equipeCache||equipeCache.id!==ctx.empresa.id){carregarEquipe();return `<div class="head"><div><h1>Equipe e acessos</h1><p>Carregando…</p></div></div>`}
  const pros=db.pros,podeDono=ctx.admin||ctx.papel==="dono";
  const opPapel=(sel)=>Object.entries(PAPEIS).filter(([k])=>k!=="dono"||podeDono||sel==="dono").map(([k,n])=>`<option value="${k}" ${sel===k?"selected":""}>${n}</option>`).join("");
  const opPro=(sel)=>`<option value="">Escolha a profissional…</option>`+pros.map(p=>`<option value="${p.id}" ${sel===p.id?"selected":""}>${esc(p.nome)}</option>`).join("");
  return `<div class="head"><div><h1>Equipe e acessos</h1><p>Convide pelo e-mail. A pessoa cria a conta com esse e-mail e já entra em ${esc(ctx.empresa.nome)} com o perfil escolhido.</p></div></div>
  <div class="grid g-2">
   <div class="panel"><h2>Quem tem acesso</h2><div class="tw"><table><thead><tr><th>Pessoa</th><th>Perfil</th><th>Agenda de</th><th></th></tr></thead><tbody>
    ${equipeCache.m.map(m=>{const eu=ctx.user&&m.user_id===ctx.user.id,trava=m.papel==="dono"&&!podeDono;return `<tr><td>${esc(m.email||"—")}${eu?'<span class="sub">Você</span>':""}</td>
      <td>${eu||trava?PAPEIS[m.papel]:`<select class="f" data-mem="${m.user_id}" data-campo="papel">${opPapel(m.papel)}</select>`}</td>
      <td>${m.papel==="profissional"?(eu||trava?esc((pros.find(p=>p.id===m.profissional_id)||{}).nome||"—"):`<select class="f" data-mem="${m.user_id}" data-campo="profissional_id">${opPro(m.profissional_id)}</select>`):'<span class="sub">Todas</span>'}</td>
      <td style="text-align:right">${eu||trava?"":`<button class="btn sm ghost danger" data-act="remmembro" data-id="${m.user_id}">Remover</button>`}</td></tr>`}).join("")}
   </tbody></table></div>
   ${equipeCache.c.length?`<h2 style="padding-top:22px">Convites aguardando</h2><div class="tw"><table><tbody>${equipeCache.c.map(c=>`<tr><td>${esc(c.email)}</td><td>${PAPEIS[c.papel]}</td><td style="text-align:right"><button class="btn sm ghost danger" data-act="remconvite" data-id="${c.id}">Cancelar</button></td></tr>`).join("")}</tbody></table></div>`:""}
   </div>
   <div class="grid" style="align-content:start">
    <div class="panel"><h2>Convidar pessoa</h2><div class="pb"><form id="convite" class="form" style="padding:0" novalidate>
      <label class="full">E-mail<input class="f" id="cv-email" type="email" required></label>
      <label>Perfil<select class="f" id="cv-papel">${opPapel("recepcao")}</select></label>
      <label id="cv-pro-w" hidden>Profissional<select class="f" id="cv-pro">${opPro("")}</select></label>
      <div id="cv-err" class="warn" hidden></div>
      <div class="full"><button class="btn pri" type="submit">Enviar convite</button></div>
    </form></div></div>
    <div class="panel"><h2>O que cada perfil faz</h2><div class="pb"><dl class="dl">
      <dt>Dono</dt><dd>Tudo, inclusive promover gestores e outros donos.</dd>
      <dt>Gestor</dt><dd>Agenda, cadastros, marca, ajustes e equipe.</dd>
      <dt>Recepção</dt><dd>Agenda, reservas e clientes. Não altera serviços, profissionais nem a marca.</dd>
      <dt>Profissional</dt><dd>Vê só os próprios atendimentos e muda o status deles.</dd>
    </dl></div></div>
   </div>
  </div>`;
}
function depoisEquipe(){
  const f=$("#convite");if(!f)return;
  const pw=$("#cv-pro-w");$("#cv-papel").onchange=()=>pw.hidden=$("#cv-papel").value!=="profissional";
  f.onsubmit=async e=>{e.preventDefault();const em=$("#cv-email").value.trim().toLowerCase(),pa=$("#cv-papel").value,pr=$("#cv-pro").value||null;
    const err=t=>{const x=$("#cv-err");x.hidden=false;x.textContent=t};
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))return err("Digite um e-mail válido.");
    if(pa==="profissional"&&!pr)return err("Escolha de qual profissional é a agenda.");
    const{error}=await sb.from("convites").upsert({empresa_id:ctx.empresa.id,email:em,papel:pa,profissional_id:pa==="profissional"?pr:null,aceito_em:null},{onConflict:"empresa_id,email"});
    if(error)return err(traduz(error));
    toast("Convite registrado para "+em);equipeCache=null;render();};
  document.querySelectorAll("[data-mem]").forEach(s=>s.onchange=async()=>{const patch={[s.dataset.campo]:s.value||null};if(s.dataset.campo==="papel"&&s.value!=="profissional")patch.profissional_id=null;
    const{error}=await sb.from("membros").update(patch).eq("empresa_id",ctx.empresa.id).eq("user_id",s.dataset.mem);toast(error?traduz(error):"Acesso atualizado");equipeCache=null;render()});
}

/* ---------- Plataforma ---------- */
let platCache=null,platAberta=null;
async function carregarPlat(){const{data,error}=await sb.rpc("resumo_empresas");if(error){toast(traduz(error));return}
  const{data:full}=await sb.from("empresas").select("id,app");const ap={};(full||[]).forEach(e=>ap[e.id]=e.app||{});
  platCache=(data||[]).map(e=>({...e,app:ap[e.id]||{}}));if(rota()==="plataforma")render()}
function vPlataforma(){
  if(!ctx.admin)return `<div class="empty">Área restrita ao administrador da plataforma.</div>`;
  if(!platCache){carregarPlat();return `<div class="head"><div><h1>Empresas</h1><p>Carregando…</p></div></div>`}
  const e=platAberta&&platCache.find(x=>x.id===platAberta);
  return `<div class="head"><div><h1>Empresas</h1><p>${platCache.length} empresas na plataforma · ${platCache.filter(x=>x.ativa).length} ativas</p></div><div class="tools"><button class="btn pri" data-act="novaempresa">+ Nova empresa</button></div></div>
  <div class="panel"><div class="tw"><table><thead><tr><th>Empresa</th><th>Plano</th><th>Pessoas</th><th>Clientes</th><th>Reservas 30 dias</th><th>Desde</th><th>Status</th><th></th></tr></thead><tbody>
  ${platCache.map(x=>`<tr><td><b>${esc(x.nome)}</b><span class="sub">${esc(x.slug)}</span></td><td>${esc(x.plano)}</td><td class="num">${x.membros}${x.convites_pendentes?`<span class="sub">+${x.convites_pendentes} convite${x.convites_pendentes>1?"s":""}</span>`:""}</td><td class="num">${x.clientes}</td><td class="num">${x.reservas_30d}</td><td class="num">${new Date(x.criado_em).toLocaleDateString("pt-BR")}</td>
   <td>${x.ativa?'<span class="pill st-confirmada">Ativa</span>':'<span class="pill st-cancelada">Pausada</span>'}</td>
   <td style="text-align:right;white-space:nowrap"><button class="btn sm" data-act="entrarempresa" data-id="${x.id}">Abrir</button> <button class="btn sm ghost" data-act="cfgempresa" data-id="${x.id}">Configurar</button></td></tr>`).join("")}
  </tbody></table>${platCache.length?"":'<div class="empty">Nenhuma empresa ainda. Crie a primeira.</div>'}</div></div>`;
}
function modalNovaEmpresa(){
  modal("Nova empresa","Cria o espaço isolado da empresa e convida o dono pelo e-mail.",`
   <label class="full">Nome da empresa<input class="f" id="ne-nome" placeholder="Ex.: Vivarium Spa"></label>
   <label>Endereço curto<input class="f" id="ne-slug" placeholder="vivarium-spa"></label>
   <label>E-mail do dono<input class="f" id="ne-email" type="email" placeholder="dono@empresa.com.br"></label>
   <div class="info">O dono cria a conta com esse e-mail e entra direto na empresa. Ele mesmo sobe o logo, as cores e convida a equipe.</div>`,
  ()=>{const nome=$("#ne-nome").value.trim(),slug=$("#ne-slug").value.trim(),em=$("#ne-email").value.trim();
    if(!nome)return "Informe o nome.";if(!/^[a-z0-9-]{2,40}$/.test(slug))return "O endereço curto usa só letras minúsculas, números e hífen.";
    sb.rpc("criar_empresa",{p_nome:nome,p_slug:slug,p_email_dono:em,p_marca:{nome,empresa:nome}}).then(({error})=>{if(error){toast(/duplicate|unique/i.test(error.message)?"Já existe uma empresa com esse endereço curto.":traduz(error));return}
      toast("Empresa criada");platCache=null;carregarContexto().then(()=>{location.hash="plataforma"})});
    return "Criando empresa…";});
  const n=$("#ne-nome"),s=$("#ne-slug");n.oninput=()=>{if(!s.dataset.mexeu)s.value=n.value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40)};s.oninput=()=>s.dataset.mexeu=1;
}
function modalCfgEmpresa(id){
  const e=platCache.find(x=>x.id===id);const a=e.app||{};
  modal(esc(e.nome),"Plano, status e o app desta empresa.",`
   <label>Plano<select class="f" id="ce-plano">${["gratis","essencial","completo"].map(p=>`<option ${e.plano===p?"selected":""}>${p}</option>`).join("")}</select></label>
   <label class="chk" style="align-self:end"><input type="checkbox" id="ce-ativa" ${e.ativa?"checked":""}>Acesso ativo</label>
   <label class="full">Link do APK Android<input class="f" id="ce-apk" value="${esc(a.android||"")}" placeholder="apps/empresa.apk ou https://…"></label>
   <label>Versão do app<input class="f" id="ce-ver" value="${esc(a.versao||"")}"></label>
   <label>Tamanho<input class="f" id="ce-tam" value="${esc(a.tamanho||"")}" placeholder="1,3 MB"></label>
   <label>Data da versão<input class="f" id="ce-data" value="${esc(a.data||"")}" placeholder="19/11/2026"></label>
   <label>Ícone (link)<input class="f" id="ce-ico" value="${esc(a.icone||"")}" placeholder="apps/empresa-icone.png"></label>`,
  ()=>{const app={android:$("#ce-apk").value.trim(),versao:$("#ce-ver").value.trim(),tamanho:$("#ce-tam").value.trim(),data:$("#ce-data").value.trim(),icone:$("#ce-ico").value.trim()};
    sb.from("empresas").update({plano:$("#ce-plano").value,ativa:$("#ce-ativa").checked,app}).eq("id",id).then(({error})=>{toast(error?traduz(error):"Empresa atualizada");platCache=null;if(ctx.empresa&&ctx.empresa.id===id)db.app=app;render()});
    return "Salvando…";});
}

/* ---------- ações ---------- */
async function acao(a,el,e){
  if(a==="sair"){e.preventDefault();await sb.auth.signOut();location.hash="";location.reload();return true}
  if(a==="reivindicar"){const{data,error}=await sb.rpc("reivindicar_plataforma");toast(error?traduz(error):data?"Você agora administra a plataforma":"A plataforma já tem dono");if(data){await carregarContexto()}return true}
  if(a==="novaempresa"){modalNovaEmpresa();return true}
  if(a==="cfgempresa"){modalCfgEmpresa(el.dataset.id);return true}
  if(a==="entrarempresa"){await abrirEmpresa(el.dataset.id);location.hash="painel";return true}
  if(a==="remmembro"){if(el.dataset.arm!=="1"){el.dataset.arm="1";el.textContent="Confirmar";return true}const{error}=await sb.from("membros").delete().eq("empresa_id",ctx.empresa.id).eq("user_id",el.dataset.id);toast(error?traduz(error):"Acesso removido");equipeCache=null;render();return true}
  if(a==="remconvite"){const{error}=await sb.from("convites").delete().eq("id",el.dataset.id);toast(error?traduz(error):"Convite cancelado");equipeCache=null;render();return true}
  return false;
}

function uuidificar(d){
  const map={};const m=id=>id==null?id:(map[id]||(map[id]=uid()));
  d.cats.forEach(c=>c.id=m(c.id));d.cats.forEach((c,i)=>c.ordem=i);
  d.servicos.forEach(s=>{s.id=m(s.id);s.pilar=m(s.pilar)});
  d.pros.forEach(p=>{p.id=m(p.id);p.servicos=p.servicos.map(m)});
  d.clientes.forEach(c=>c.id=m(c.id));
  d.reservas.forEach(r=>{r.id=uid();r.cliente=m(r.cliente);r.servico=m(r.servico);r.pro=m(r.pro)});
}

async function iniciar(){
VIEWS.equipe=vEquipe;VIEWS.plataforma=vPlataforma;
ICO.equipe='<circle cx="8" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M2.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8M14 14.6c2.6-.4 5 1 5.8 4.4"/>';
ICO.plataforma='<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><path d="M7 7h.01M7 17h.01"/>';
  sb.auth.onAuthStateChange((ev,s)=>{
    if(ev==="PASSWORD_RECOVERY"){telaAcesso("nova");return}
    if(ev==="SIGNED_IN"&&!ctx.user){setTimeout(carregarContexto,0)}
    if(ev==="SIGNED_OUT"){ctx.user=null}
  });
  const{data:{session}}=await sb.auth.getSession();
  if(location.hash.includes("type=recovery"))return;
  if(!session)return telaAcesso("entrar");
  carregarContexto();
}

window.Nuvem={iniciar,agendar,rotas:rotasPerfil,rodape,acao,uuidificar,podeOperar:opera,podeGerir:gere,depois:r=>{if(r==="equipe")depoisEquipe()},sb};
})();

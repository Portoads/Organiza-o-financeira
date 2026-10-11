 "use client";

import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, ArrowLeftRight, Wallet, ChartNoAxesCombined, Target,
  Settings, Bell, Search, Plus, ArrowUpRight, ArrowDownRight, PiggyBank,
  TrendingUp, Home, ShoppingBasket, CarFront, Wifi, GraduationCap, HeartPulse,
  MoreHorizontal, CalendarDays, Download, Trash2, X, Check, ChevronDown,
  Menu, CircleDollarSign, ReceiptText, Sparkles
} from "lucide-react";

const categories = [
  "Salário", "Freelance/Serviços", "Vendas", "Outras entradas", "Água", "Luz",
  "Aluguel", "Condomínio", "Alimentação", "Compra do mês", "Gasolina/Transporte",
  "Internet/Telefone", "Cursos/Educação", "Saúde", "Lazer", "Assinaturas",
  "Cartão de crédito", "Impostos", "Manutenção", "Investimentos",
  "Reserva de emergência", "Poupança", "Outros"
];
const types = ["Entrada", "Despesa", "Investimento", "Guardado"];
const seed = [
  {id:1,date:"2026-10-02",description:"Projeto de site",type:"Entrada",category:"Freelance/Serviços",amount:2450,account:"Pix"},
  {id:2,date:"2026-10-03",description:"Aluguel",type:"Despesa",category:"Aluguel",amount:950,account:"Pix"},
  {id:3,date:"2026-10-04",description:"Compra do mês",type:"Despesa",category:"Compra do mês",amount:428.65,account:"Débito"},
  {id:4,date:"2026-10-05",description:"Internet residencial",type:"Despesa",category:"Internet/Telefone",amount:99.9,account:"Débito"},
  {id:5,date:"2026-10-06",description:"Reserva de emergência",type:"Guardado",category:"Reserva de emergência",amount:400,account:"Transferência"},
  {id:6,date:"2026-10-07",description:"Gasolina",type:"Despesa",category:"Gasolina/Transporte",amount:180,account:"Crédito"},
  {id:7,date:"2026-10-08",description:"Curso online",type:"Despesa",category:"Cursos/Educação",amount:89.9,account:"Crédito"},
  {id:8,date:"2026-10-09",description:"Aplicação CDB",type:"Investimento",category:"Investimentos",amount:600,account:"Transferência"},
];
const brl = n => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n || 0);
const monthKey = d => (d || "").slice(0,7);
const monthName = value => {
  if(!value) return "";
  const [y,m]=value.split("-");
  return new Date(Number(y),Number(m)-1,1).toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
};
const datePt = d => d ? new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}) : "—";
const iconFor = category => {
  if(["Aluguel","Condomínio"].includes(category)) return Home;
  if(["Alimentação","Compra do mês"].includes(category)) return ShoppingBasket;
  if(category.includes("Gasolina") || category.includes("Transporte")) return CarFront;
  if(category.includes("Internet") || category==="Água" || category==="Luz") return Wifi;
  if(category.includes("Curso")) return GraduationCap;
  if(category==="Saúde") return HeartPulse;
  if(category==="Investimentos") return TrendingUp;
  if(category.includes("Reserva") || category==="Poupança") return PiggyBank;
  return ReceiptText;
};
const colors = ["#6c7cff","#37c8a4","#f4b860","#a78bfa","#f47777","#50b9e8","#e58fc4","#92a8b3"];

export default function HomePage(){
  const [transactions,setTransactions]=useState([]);
  const [month,setMonth]=useState(new Date().toISOString().slice(0,7));
  const [active,setActive]=useState("Visão geral");
  const [modal,setModal]=useState(false);
  const [search,setSearch]=useState("");
  const [typeFilter,setTypeFilter]=useState("Todos");
  const [mobileNav,setMobileNav]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const [form,setForm]=useState({date:new Date().toISOString().slice(0,10),description:"",type:"Despesa",category:"Alimentação",amount:"",account:"Pix",notes:""});

  useEffect(()=>{
    try {
      const raw=localStorage.getItem("fluxo-transactions-v1");
      if(raw) setTransactions(JSON.parse(raw));
      else setTransactions(seed);
    } catch { setTransactions(seed); }
    setLoaded(true);
  },[]);
  useEffect(()=>{ if(loaded) localStorage.setItem("fluxo-transactions-v1",JSON.stringify(transactions)); },[transactions,loaded]);

  const monthTransactions=useMemo(()=>transactions.filter(t=>monthKey(t.date)===month),[transactions,month]);
  const totals=useMemo(()=>{
    const sum=type=>monthTransactions.filter(t=>t.type===type).reduce((a,t)=>a+Number(t.amount||0),0);
    return {income:sum("Entrada"),expenses:sum("Despesa"),invested:sum("Investimento"),saved:sum("Guardado")};
  },[monthTransactions]);
  const balance=totals.income-totals.expenses-totals.invested-totals.saved;
  const expenseByCategory=useMemo(()=>{
    const map={};
    monthTransactions.filter(t=>t.type==="Despesa").forEach(t=>map[t.category]=(map[t.category]||0)+Number(t.amount));
    return Object.entries(map).sort((a,b)=>b[1]-a[1]);
  },[monthTransactions]);
  const filtered=useMemo(()=>monthTransactions.filter(t=>(typeFilter==="Todos"||t.type===typeFilter)&&`${t.description} ${t.category} ${t.account}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>b.date.localeCompare(a.date)),[monthTransactions,typeFilter,search]);
  const expenseTotal=totals.expenses||0;
  const donut=expenseByCategory.reduce((acc,[name,value],i)=>{
    const start=acc.end; const end=start+(expenseTotal?value/expenseTotal*100:0);
    acc.parts.push(`${colors[i%colors.length]} ${start}% ${end}%`);acc.end=end;return acc;
  },{parts:[],end:0}).parts.join(", ");

  function saveTransaction(e){
    e.preventDefault();
    if(!form.description.trim() || Number(form.amount)<=0) return;
    const item={...form,id:Date.now(),amount:Number(form.amount)};
    setTransactions(prev=>[item,...prev]);
    setMonth(monthKey(form.date));
    setForm({...form,description:"",amount:"",notes:""});
    setModal(false);
  }
  function removeTransaction(id){ if(confirm("Excluir este lançamento?")) setTransactions(prev=>prev.filter(t=>t.id!==id)); }
  function exportCSV(){
    const rows=[["Data","Descrição","Tipo","Categoria","Valor","Conta","Observações"],...monthTransactions.map(t=>[t.date,t.description,t.type,t.category,t.amount,t.account,t.notes||""])];
    const csv=rows.map(row=>row.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(";")).join("\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`fluxo-${month}.csv`;a.click();URL.revokeObjectURL(url);
  }

  const navItems=[
    {name:"Visão geral",icon:LayoutDashboard},
    {name:"Lançamentos",icon:ArrowLeftRight},
    {name:"Orçamento",icon:Wallet},
    {name:"Investimentos",icon:ChartNoAxesCombined},
    {name:"Metas",icon:Target},
  ];
  const monthOptions=[];
  for(let i=-6;i<=6;i++){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()+i);monthOptions.push(d.toISOString().slice(0,7));}

  return <main className="app-shell">
    {mobileNav&&<div className="mobile-overlay" onClick={()=>setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav?"sidebar-open":""}`}>
      <div className="brand"><div className="brand-mark"><ChartNoAxesCombined size={22}/></div><span>fluxo<span className="brand-dot">.</span></span></div>
      <div className="workspace"><div className="workspace-avatar">FP</div><div className="workspace-text"><strong>Minhas finanças</strong><small>Espaço pessoal</small></div><ChevronDown size={15}/></div>
      <div className="nav-label">MENU PRINCIPAL</div>
      <nav className="nav-list">{navItems.map(item=><button key={item.name} className={`nav-item ${active===item.name?"active":""}`} onClick={()=>{setActive(item.name);setMobileNav(false);}}><item.icon size={18}/><span>{item.name}</span>{item.name==="Lançamentos"&&<span className="nav-count">{transactions.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="tip-card"><div className="tip-icon"><Sparkles size={17}/></div><strong>Pequenos passos,<br/>grandes resultados.</strong><p>Organize hoje para conquistar amanhã.</p><div className="tip-progress"><span/></div><small>Seu controle começa aqui</small></div>
        <button className={`nav-item ${active==="Configurações"?"active":""}`} onClick={()=>setActive("Configurações")}><Settings size={18}/><span>Configurações</span></button>
        <div className="profile"><div className="profile-avatar">F</div><div className="profile-info"><strong>Meu perfil</strong><small>Controle pessoal</small></div><MoreHorizontal size={19}/></div>
      </div>
    </aside>

    <section className="main-area">
      <header className="topbar">
        <button className="mobile-menu icon-button" onClick={()=>setMobileNav(!mobileNav)} aria-label="Abrir menu"><Menu size={20}/></button>
        <div className="breadcrumb">Finanças <span>/</span> <strong>{active}</strong></div>
        <div className="top-actions"><label className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar lançamento..."/><kbd>⌘ K</kbd></label><button className="icon-button notification" aria-label="Notificações"><Bell size={18}/><i/></button><div className="top-avatar">F</div></div>
      </header>

      <div className="content">
        <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> SEU PAINEL FINANCEIRO</div><h1>{active==="Visão geral"?"Seu dinheiro, sob controle":active}</h1><p>Acompanhe sua vida financeira e tome decisões com confiança.</p></div>
          <div className="heading-actions"><label className="month-select"><CalendarDays size={16}/><select value={month} onChange={e=>setMonth(e.target.value)} aria-label="Selecionar mês">{monthOptions.map(m=><option key={m} value={m}>{monthName(m)}</option>)}</select><ChevronDown size={14}/></label><button className="primary-button" onClick={()=>setModal(true)}><Plus size={18}/> Novo lançamento</button></div>
        </div>

        {active==="Configurações"?<section className="settings-panel"><div className="section-title"><h2>Configurações</h2></div><p>Seus dados ficam salvos neste navegador usando armazenamento local.</p><button className="secondary-button" onClick={()=>{if(confirm("Apagar todos os lançamentos salvos neste navegador?"))setTransactions([])}}><Trash2 size={16}/> Apagar todos os lançamentos</button><p className="muted-note">Atenção: os dados não são sincronizados entre dispositivos nem enviados para uma conta na nuvem.</p></section>:<>
        <div className="kpi-grid">
          <article className="kpi-card"><div className="kpi-top"><span className="kpi-icon green"><ArrowDownRight size={19}/></span><span className="kpi-tag positive">Entradas</span><button className="kpi-more"><MoreHorizontal size={19}/></button></div><div className="kpi-label">Total de entradas</div><div className="kpi-value">{brl(totals.income)}</div><div className="kpi-foot"><span className="foot-icon green-text"><ArrowUpRight size={14}/></span><span>Dinheiro que entrou no mês</span></div><div className="kpi-spark green-spark"><svg viewBox="0 0 120 34" preserveAspectRatio="none"><path d="M0 27 C15 26 18 14 32 19 S52 26 65 12 S87 20 100 6 S113 10 120 2" /></svg></div></article>
          <article className="kpi-card"><div className="kpi-top"><span className="kpi-icon red"><ArrowUpRight size={19}/></span><span className="kpi-tag negative">Despesas</span><button className="kpi-more"><MoreHorizontal size={19}/></button></div><div className="kpi-label">Total de despesas</div><div className="kpi-value">{brl(totals.expenses)}</div><div className="kpi-foot"><span className="foot-icon red-text"><ArrowDownRight size={14}/></span><span>Contas e gastos do mês</span></div><div className="kpi-spark red-spark"><svg viewBox="0 0 120 34" preserveAspectRatio="none"><path d="M0 7 C15 14 18 4 32 17 S52 8 65 24 S87 13 100 26 S113 23 120 31" /></svg></div></article>
          <article className="kpi-card"><div className="kpi-top"><span className="kpi-icon blue"><ChartNoAxesCombined size={19}/></span><span className="kpi-tag blue-tag">Investimentos</span><button className="kpi-more"><MoreHorizontal size={19}/></button></div><div className="kpi-label">Total investido</div><div className="kpi-value">{brl(totals.invested)}</div><div className="kpi-foot"><span className="foot-icon blue-text"><TrendingUp size={14}/></span><span>Construindo patrimônio</span></div><div className="kpi-spark blue-spark"><svg viewBox="0 0 120 34" preserveAspectRatio="none"><path d="M0 29 C15 22 18 28 32 18 S52 23 65 13 S87 16 100 5 S113 8 120 1" /></svg></div></article>
          <article className="kpi-card"><div className="kpi-top"><span className="kpi-icon purple"><PiggyBank size={19}/></span><span className="kpi-tag purple-tag">Reserva</span><button className="kpi-more"><MoreHorizontal size={19}/></button></div><div className="kpi-label">Total guardado</div><div className="kpi-value">{brl(totals.saved)}</div><div className="kpi-foot"><span className="foot-icon purple-text"><Target size={14}/></span><span>Dinheiro separado</span></div><div className="kpi-spark purple-spark"><svg viewBox="0 0 120 34" preserveAspectRatio="none"><path d="M0 28 C15 24 18 29 32 17 S52 21 65 16 S87 12 100 7 S113 8 120 2" /></svg></div></article>
        </div>

        <div className="middle-grid">
          <section className="panel balance-panel"><div className="panel-heading"><div><h2>Resumo do mês</h2><p>Uma visão clara do seu dinheiro</p></div><button className="subtle-button" onClick={()=>setActive("Lançamentos")}>Ver lançamentos <ArrowUpRight size={15}/></button></div>
            <div className="balance-main"><div><span className="balance-caption">Saldo após despesas, investimentos e reserva</span><div className={`balance-value ${balance<0?"negative-balance":""}`}>{brl(balance)}</div></div><div className="balance-pill"><span className={balance>=0?"pill-dot":"pill-dot red-dot"}/>{balance>=0?"Saldo positivo":"Saldo negativo"}</div></div>
            <div className="flow-bar"><div className="flow-income" style={{width:`${totals.income?Math.min(100,totals.income/(totals.income+totals.expenses+totals.invested+totals.saved)*100):0}%`}}/><div className="flow-expenses" style={{width:`${totals.income?Math.min(100,totals.expenses/(totals.income+totals.expenses+totals.invested+totals.saved)*100):0}%`}}/><div className="flow-invest" style={{width:`${totals.income?Math.min(100,totals.invested/(totals.income+totals.expenses+totals.invested+totals.saved)*100):0}%`}}/></div>
            <div className="legend-grid"><div><span className="legend-dot green-bg"/><span>Entradas</span><strong>{brl(totals.income)}</strong></div><div><span className="legend-dot red-bg"/><span>Despesas</span><strong>{brl(totals.expenses)}</strong></div><div><span className="legend-dot blue-bg"/><span>Investido</span><strong>{brl(totals.invested)}</strong></div><div><span className="legend-dot purple-bg"/><span>Guardado</span><strong>{brl(totals.saved)}</strong></div></div>
          </section>
          <section className="panel spending-panel"><div className="panel-heading"><div><h2>Para onde vai seu dinheiro?</h2><p>Distribuição das despesas</p></div><button className="dots-button"><MoreHorizontal size={19}/></button></div>
            {expenseByCategory.length===0?<div className="empty-chart"><div className="empty-donut"><CircleDollarSign size={25}/></div><strong>Sem despesas por enquanto</strong><span>Adicione lançamentos para ver a distribuição.</span></div>:<div className="donut-layout"><div className="donut" style={{background:`conic-gradient(${donut})`}}><div className="donut-hole"><span>Total gasto</span><strong>{brl(expenseTotal)}</strong></div></div><div className="donut-legend">{expenseByCategory.slice(0,5).map(([name,value],i)=><div className="donut-legend-row" key={name}><span className="legend-dot" style={{background:colors[i%colors.length]}}/><span className="legend-name">{name}</span><strong>{Math.round(value/(expenseTotal||1)*100)}%</strong></div>)}</div></div>}
            <button className="full-link" onClick={()=>setActive("Orçamento")}>Ver análise de despesas <ArrowUpRight size={15}/></button>
          </section>
        </div>

        <div className="bottom-grid">
          <section className="panel transactions-panel"><div className="panel-heading transaction-heading"><div><h2>Últimos lançamentos</h2><p>Movimentações de {monthName(month)}</p></div><div className="table-actions"><button className="secondary-button export-button" onClick={exportCSV}><Download size={15}/> Exportar</button><button className="subtle-button" onClick={()=>setActive("Lançamentos")}>Ver todos <ArrowUpRight size={15}/></button></div></div>
            <div className="filter-row"><div className="filter-tabs">{["Todos","Entrada","Despesa","Investimento","Guardado"].map(t=><button key={t} className={typeFilter===t?"filter-active":""} onClick={()=>setTypeFilter(t)}>{t==="Todos"?"Todos":t==="Entrada"?"Entradas":t==="Despesa"?"Despesas":t==="Investimento"?"Investidos":"Guardados"}</button>)}</div></div>
            <div className="table-wrap"><table><thead><tr><th>DESCRIÇÃO</th><th>DATA</th><th>CATEGORIA</th><th>TIPO</th><th className="align-right">VALOR</th><th/></tr></thead><tbody>{filtered.slice(0,7).map(t=>{const Icon=iconFor(t.category);return <tr key={t.id}><td><div className="transaction-name"><span className={`transaction-icon ${t.type==="Entrada"?"income-icon":t.type==="Despesa"?"expense-icon":t.type==="Investimento"?"invest-icon":"saved-icon"}`}><Icon size={16}/></span><span><strong>{t.description}</strong><small>{t.account}</small></span></div></td><td className="date-cell">{datePt(t.date)}</td><td><span className="category-chip">{t.category}</span></td><td><span className={`type-label ${t.type==="Entrada"?"type-income":t.type==="Despesa"?"type-expense":t.type==="Investimento"?"type-invest":"type-saved"}`}>{t.type}</span></td><td className={`align-right amount-cell ${t.type==="Entrada"?"amount-income":""}`}>{t.type==="Entrada"?"+ ":"− "}{brl(t.amount)}</td><td><button className="row-delete" onClick={()=>removeTransaction(t.id)} aria-label={`Excluir ${t.description}`} title="Excluir"><Trash2 size={15}/></button></td></tr>})}</tbody></table>{filtered.length===0&&<div className="empty-table"><ReceiptText size={25}/><strong>Nenhum lançamento encontrado</strong><span>Experimente mudar o filtro ou adicionar uma movimentação.</span><button className="primary-button small" onClick={()=>setModal(true)}><Plus size={15}/> Adicionar lançamento</button></div>}</div>
          </section>
          <section className="panel categories-panel"><div className="panel-heading"><div><h2>Principais despesas</h2><p>Por categoria neste mês</p></div><button className="dots-button"><MoreHorizontal size={19}/></button></div>
            {expenseByCategory.length===0?<div className="category-empty">Suas categorias vão aparecer aqui conforme você registrar despesas.</div>:<div className="category-list">{expenseByCategory.slice(0,6).map(([name,value],i)=>{const Icon=iconFor(name);return <div className="category-row" key={name}><div className="category-row-top"><div className="category-left"><span className="category-icon" style={{color:colors[i%colors.length],background:colors[i%colors.length]+"18"}}><Icon size={16}/></span><span>{name}</span></div><strong>{brl(value)}</strong></div><div className="category-track"><span style={{width:`${Math.max(2,value/(expenseTotal||1)*100)}%`,background:colors[i%colors.length]}}/></div></div>})}</div>}
            <div className="useful-spending"><div className="useful-icon"><Sparkles size={16}/></div><div><strong>Gastos essenciais</strong><p>Água, luz, aluguel, alimentação, transporte, internet e cursos.</p><span>{brl(monthTransactions.filter(t=>t.type==="Despesa"&&["Água","Luz","Aluguel","Condomínio","Alimentação","Compra do mês","Gasolina/Transporte","Internet/Telefone","Cursos/Educação","Saúde"].includes(t.category)).reduce((a,t)=>a+Number(t.amount),0))} neste mês</span></div></div>
          </section>
        </div>
        {active==="Orçamento"&&<div className="below-note"><strong>Orçamento mensal</strong><p>Use as despesas por categoria para acompanhar seus gastos. O orçamento planejado poderá ser configurado numa próxima versão.</p></div>}
        {active==="Investimentos"&&<div className="below-note"><strong>Visão de investimentos</strong><p>Total registrado como investido neste mês: <b>{brl(totals.invested)}</b>. Registre cada aplicação como tipo “Investimento”.</p></div>}
        {active==="Metas"&&<div className="below-note"><strong>Suas metas financeiras</strong><p>Comece registrando valores em “Guardado” para acompanhar o dinheiro separado para seus objetivos.</p></div>}
        </>}
        <footer className="footer"><span>© 2026 Fluxo Financeiro</span><span><span className="secure-dot"/> Seus dados ficam salvos neste navegador</span></footer>
      </div>
    </section>

    {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><div className="modal-kicker">NOVA MOVIMENTAÇÃO</div><h2 id="modal-title">Adicionar lançamento</h2><p>Registre uma entrada, despesa ou valor separado.</p></div><button className="icon-button" onClick={()=>setModal(false)} aria-label="Fechar"><X size={20}/></button></div><form onSubmit={saveTransaction}><div className="type-choice">{types.map(t=><button type="button" key={t} className={`type-choice-button ${form.type===t?"chosen":""} choice-${t.toLowerCase()}`} onClick={()=>setForm({...form,type:t,category:t==="Investimento"?"Investimentos":t==="Guardado"?"Reserva de emergência":t==="Entrada"?"Freelance/Serviços":"Alimentação"})}>{t}</button>)}</div><div className="form-grid"><label className="form-field full-field"><span>Descrição</span><input required autoFocus placeholder="Ex.: conta de luz, salário..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><label className="form-field"><span>Valor (R$)</span><div className="money-input"><span>R$</span><input required min="0.01" step="0.01" type="number" placeholder="0,00" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div></label><label className="form-field"><span>Data</span><input required type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label className="form-field"><span>Categoria</span><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label className="form-field"><span>Conta / pagamento</span><select value={form.account} onChange={e=>setForm({...form,account:e.target.value})}>{["Pix","Dinheiro","Débito","Crédito","Transferência","Boleto","Outro"].map(c=><option key={c}>{c}</option>)}</select></label><label className="form-field full-field"><span>Observações <small>(opcional)</small></span><input placeholder="Algum detalhe para lembrar..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setModal(false)}>Cancelar</button><button type="submit" className="primary-button"><Check size={17}/> Salvar lançamento</button></div></form></section></div>}
  </main>
}

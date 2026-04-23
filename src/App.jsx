import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'

const INCOME_CATS = [
  { id: 'sueldo', label: 'Sueldo', icon: '💼' },
  { id: 'apartamentos', label: 'Apartamentos', icon: '🏠' },
  { id: 'comisiones', label: 'Comisiones', icon: '🤝' },
  { id: 'ventas', label: 'Ventas', icon: '🛍️' },
  { id: 'otros_ing', label: 'Otros', icon: '📥' },
]
const EXPENSE_CATS = [
  { id: 'vivienda', label: 'Vivienda', icon: '🏠', color: '#6366f1' },
  { id: 'alimentacion', label: 'Alimentación', icon: '🛒', color: '#f59e0b' },
  { id: 'transporte', label: 'Transporte', icon: '🚗', color: '#3b82f6' },
  { id: 'salud', label: 'Salud', icon: '🏥', color: '#10b981' },
  { id: 'ocio', label: 'Ocio', icon: '🎉', color: '#ec4899' },
  { id: 'suscripciones', label: 'Suscripciones', icon: '📱', color: '#8b5cf6' },
  { id: 'ropa', label: 'Ropa', icon: '👗', color: '#f97316' },
  { id: 'representacion', label: 'Gastos representación', icon: '🍽️', color: '#14b8a6' },
  { id: 'lucia', label: 'Asignación Lucía', icon: '👧', color: '#f43f5e' },
  { id: 'otros', label: 'Otros', icon: '📦', color: '#6b7280' },
]
const APT_INCOME_CATS = [
  { id: 'alquiler_mensual', label: 'Alquiler mensual', icon: '🏠', color: '#10b981' },
  { id: 'reserva', label: 'Reserva', icon: '📅', color: '#3b82f6' },
  { id: 'resto_alquiler', label: 'Resto alquiler', icon: '💰', color: '#6366f1' },
  { id: 'limpieza_ing', label: 'Limpieza', icon: '🧹', color: '#f59e0b' },
  { id: 'parking', label: 'Parking', icon: '🅿️', color: '#8b5cf6' },
  { id: 'otros_apt_ing', label: 'Otros', icon: '📥', color: '#6b7280' },
]
const APT_EXPENSE_CATS = [
  { id: 'comisiones_agentes', label: 'Comisiones agentes', icon: '🤝', color: '#6366f1' },
  { id: 'limpieza', label: 'Gastos limpieza', icon: '🧹', color: '#f59e0b' },
  { id: 'sabanas', label: 'Lavado sábanas y toallas', icon: '🛏️', color: '#3b82f6' },
  { id: 'mantenimiento', label: 'Material mantenimiento', icon: '🔧', color: '#10b981' },
  { id: 'compras', label: 'Gastos por compras', icon: '🛒', color: '#ec4899' },
  { id: 'reparaciones', label: 'Reparaciones', icon: '🔨', color: '#f97316' },
  { id: 'traspaso_principal', label: 'Traspaso cuenta principal', icon: '🔄', color: '#8b5cf6' },
  { id: 'otros_apt', label: 'Otros', icon: '📦', color: '#6b7280' },
]
const DEFAULT_APTS = ['Apto 208', 'Apto 210']
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const now = new Date()
const fmt = n => Number(n||0).toLocaleString('es-ES',{style:'currency',currency:'EUR'})
const pct = (a,b) => b===0?0:Math.min(100,Math.round((a/b)*100))
const today = () => new Date().toISOString().split('T')[0]
const emptyInc = () => ({desc:'',amount:'',cat:'sueldo',date:today(),notes:'',tag:'',recurrent:false})
const emptyExp = () => ({desc:'',amount:'',cat:'otros',date:today(),notes:'',tag:'',recurrent:false})
const emptyAptEntry = apts => ({desc:'',amount:'',type:'ingreso',cat:'alquiler_mensual',apt:apts[0]||'',date:today(),notes:'',tag:''})

const Input = ({style,...p}) => <input {...p} style={{border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',fontSize:14,outline:'none',background:'var(--input-bg)',color:'var(--text)',...style}}/>
const Select = ({style,...p}) => <select {...p} style={{border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',fontSize:14,outline:'none',background:'var(--input-bg)',color:'var(--text)',...style}}/>
const Btn = ({color='#111827',textColor='#fff',style,...p}) => <button {...p} style={{background:color,color:textColor,border:'none',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontWeight:700,fontSize:13,...style}}/>
const Card = ({style,...p}) => <div {...p} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:16,...style}}/>
const ActionBtns = ({onEdit,onDelete}) => (
  <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
    <button onClick={onEdit} style={{border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',borderRadius:7,padding:'4px 8px',cursor:'pointer',fontSize:13,fontWeight:600}}>✏️ Editar</button>
    <button onClick={onDelete} style={{border:'1px solid #ef4444',background:'none',color:'#ef4444',borderRadius:7,padding:'4px 8px',cursor:'pointer',fontSize:13,fontWeight:600}}>✕</button>
  </div>
)

function EditModal({item,cats,aptList,onSave,onClose,dark}) {
  const [f,setF] = useState({...item,amount:String(item.amount)})
  const inp = {background:dark?'#0f172a':'#fff',color:dark?'#f1f5f9':'#111827',border:`1px solid ${dark?'#334155':'#e5e7eb'}`}
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:dark?'#1e293b':'#fff',borderRadius:16,padding:20,width:'100%',maxWidth:420,boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <span style={{fontWeight:800,fontSize:16,color:dark?'#f1f5f9':'#111827'}}>✏️ Editar registro</span>
          <button onClick={onClose} style={{border:'none',background:'none',fontSize:20,cursor:'pointer',color:dark?'#94a3b8':'#6b7280'}}>✕</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
          <Input placeholder="Descripción" value={f.desc} onChange={e=>setF(x=>({...x,desc:e.target.value}))} style={{gridColumn:'1/-1',...inp}}/>
          {cats&&<Select value={f.cat||''} onChange={e=>setF(x=>({...x,cat:e.target.value}))} style={{gridColumn:'1/-1',...inp}}>{cats.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</Select>}
          {aptList&&<Select value={f.apt||''} onChange={e=>setF(x=>({...x,apt:e.target.value}))} style={{gridColumn:'1/-1',...inp}}>{aptList.map(a=><option key={a} value={a}>{a}</option>)}</Select>}
          <Input type="number" placeholder="Importe (€)" value={f.amount} onChange={e=>setF(x=>({...x,amount:e.target.value}))} style={inp}/>
          <Input type="date" value={f.date||''} onChange={e=>setF(x=>({...x,date:e.target.value}))} style={inp}/>
          <Input placeholder="Etiqueta" value={f.tag||''} onChange={e=>setF(x=>({...x,tag:e.target.value}))} style={inp}/>
          <Input placeholder="Notas" value={f.notes||''} onChange={e=>setF(x=>({...x,notes:e.target.value}))} style={inp}/>
        </div>
        {f.hasOwnProperty('recurrent')&&(
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <input type="checkbox" checked={!!f.recurrent} onChange={e=>setF(x=>({...x,recurrent:e.target.checked}))} style={{cursor:'pointer'}}/>
            <label style={{fontSize:13,cursor:'pointer',color:dark?'#f1f5f9':'#111827'}}>Recurrente mensual</label>
          </div>
        )}
        <div style={{display:'flex',gap:8}}>
          <Btn color={dark?'#6366f1':'#111827'} style={{flex:1}} onClick={()=>onSave({...f,amount:parseFloat(f.amount)||0})}>Guardar cambios</Btn>
          <Btn color="#6b7280" style={{flex:1}} onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </div>
  )
}

function ConfirmModal({item,monthLabel,onConfirm,onClose,dark}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:dark?'#1e293b':'#fff',borderRadius:16,padding:24,width:'100%',maxWidth:380,boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{fontSize:32,textAlign:'center',marginBottom:12}}>🔄</div>
        <div style={{fontWeight:800,fontSize:16,textAlign:'center',marginBottom:8,color:dark?'#f1f5f9':'#111827'}}>Traspasar a ingresos principales</div>
        <div style={{fontSize:14,color:dark?'#94a3b8':'#6b7280',textAlign:'center',marginBottom:20,lineHeight:1.6}}>
          ¿Confirmas traspasar <strong style={{color:dark?'#f1f5f9':'#111827'}}>{item.desc}</strong> ({fmt(item.amount)}) como ingreso en <strong>{monthLabel}</strong>?
        </div>
        <div style={{display:'flex',gap:8}}>
          <Btn color="#10b981" style={{flex:1}} onClick={onConfirm}>✅ Sí, traspasar</Btn>
          <Btn color="#6b7280" style={{flex:1}} onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </div>
  )
}

function CatSummary({entries,cats,colorDefault,total}) {
  const rows=cats.map(c=>({...c,total:entries.filter(e=>e.cat===c.id).reduce((s,e)=>s+e.amount,0)})).filter(c=>c.total>0)
  if(!rows.length) return null
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {rows.map(c=>(
        <div key={c.id}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:3}}><span>{c.icon} {c.label}</span><span style={{fontWeight:700}}>{fmt(c.total)} ({pct(c.total,total)}%)</span></div>
          <div style={{background:'var(--border)',borderRadius:99,height:8}}><div style={{width:`${pct(c.total,total)}%`,height:'100%',background:c.color||colorDefault,borderRadius:99,transition:'width .4s'}}/></div>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [dark,setDark] = useState(false)
  const [view,setView] = useState('dashboard')
  const [year,setYear] = useState(now.getFullYear())
  const [month,setMonth] = useState(now.getMonth())
  const [data,setData] = useState({incomes:[],expenses:[],savingGoal:0})
  const [savings,setSavings] = useState({initialBalance:0,deposits:[],transactions:[]})
  const [aptData,setAptData] = useState({entries:[]})
  const [aptList,setAptList] = useState(DEFAULT_APTS)
  const [loading,setLoading] = useState(true)
  const [saving,setSaving] = useState(false)
  const [toast,setToast] = useState(null)
  const [calcTab,setCalcTab] = useState('hipoteca')
  const [incF,setIncF] = useState(emptyInc())
  const [expF,setExpF] = useState(emptyExp())
  const [aptF,setAptF] = useState(emptyAptEntry(DEFAULT_APTS))
  const [savExpF,setSavExpF] = useState({desc:'',amount:'',date:today(),notes:''})
  const [savDepF,setSavDepF] = useState({desc:'',amount:'',date:today()})
  const [goalF,setGoalF] = useState('')
  const [budgets,setBudgets] = useState({})
  const [budgetEdit,setBudgetEdit] = useState({})
  const [savingInitial,setSavingInitial] = useState('')
  const [calc,setCalc] = useState({capital:150000,rate:3.5,years:25,loan:10000,lrate:8,lyears:3,emergency:3})
  const [history,setHistory] = useState([])
  const [editing,setEditing] = useState(null)
  const [confirming,setConfirming] = useState(null)
  const [newAptName,setNewAptName] = useState('')
  const [aptFilter,setAptFilter] = useState('todos')

  const showToast = (msg,type='ok') => { setToast({msg,type}); setTimeout(()=>setToast(null),3500) }

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}}) => { setSession(session); setAuthLoading(false) })
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  const uid = () => session?.user?.id

  // Load monthly data
  const loadMonthData = useCallback(async (y, m) => {
    if(!uid()) return
    setLoading(true)
    const [monthRes, savRes, aptRes, budRes] = await Promise.all([
      supabase.from('monthly_data').select('*').eq('user_id',uid()).eq('year',y).eq('month',m).single(),
      supabase.from('savings').select('*').eq('user_id',uid()).single(),
      supabase.from('apartments_data').select('*').eq('user_id',uid()).single(),
      supabase.from('budgets').select('*').eq('user_id',uid()).eq('year',y).eq('month',m).single(),
    ])
    setData(monthRes.data ? {incomes:monthRes.data.incomes||[],expenses:monthRes.data.expenses||[],savingGoal:monthRes.data.saving_goal||0} : {incomes:[],expenses:[],savingGoal:0})
    setSavings(savRes.data ? {initialBalance:savRes.data.initial_balance||0,deposits:savRes.data.deposits||[],transactions:savRes.data.transactions||[]} : {initialBalance:0,deposits:[],transactions:[]})
    const al = aptRes.data?.apt_list || DEFAULT_APTS
    setAptData(aptRes.data ? {entries:aptRes.data.entries||[]} : {entries:[]})
    setAptList(al); setAptF(emptyAptEntry(al))
    setBudgets(budRes.data?.data || {})
    setLoading(false)
  }, [session])

  const loadHistory = useCallback(async () => {
    if(!uid()) return
    const {data} = await supabase.from('monthly_data').select('*').eq('user_id',uid()).order('year',{ascending:false}).order('month',{ascending:false})
    setHistory(data||[])
  }, [session])

  useEffect(() => { if(session) loadMonthData(year,month) }, [year,month,session])
  useEffect(() => { if(view==='historial'&&session) loadHistory() }, [view,session])

  // Save helpers
  const saveMonth = async nd => {
    setSaving(true)
    await supabase.from('monthly_data').upsert({user_id:uid(),year,month,incomes:nd.incomes,expenses:nd.expenses,saving_goal:nd.savingGoal},{onConflict:'user_id,year,month'})
    setData(nd); setSaving(false)
  }
  const saveSavings = async ns => {
    await supabase.from('savings').upsert({user_id:uid(),initial_balance:ns.initialBalance,deposits:ns.deposits,transactions:ns.transactions},{onConflict:'user_id'})
    setSavings(ns)
  }
  const saveApt = async na => {
    await supabase.from('apartments_data').upsert({user_id:uid(),entries:na.entries,apt_list:aptList},{onConflict:'user_id'})
    setAptData(na)
  }
  const saveAptList = async nl => {
    await supabase.from('apartments_data').upsert({user_id:uid(),entries:aptData.entries,apt_list:nl},{onConflict:'user_id'})
    setAptList(nl)
  }
  const saveBudgets = async nb => {
    await supabase.from('budgets').upsert({user_id:uid(),year,month,data:nb},{onConflict:'user_id,year,month'})
    setBudgets(nb)
  }

  const saveEntryToCorrectMonth = async (entry, type) => {
    let tY=year,tM=month
    if(entry.date){const d=new Date(entry.date);tY=d.getFullYear();tM=d.getMonth()}
    const same=tY===year&&tM===month
    const {data:existing} = await supabase.from('monthly_data').select('*').eq('user_id',uid()).eq('year',tY).eq('month',tM).single()
    const base = existing ? {incomes:existing.incomes||[],expenses:existing.expenses||[],savingGoal:existing.saving_goal||0} : {incomes:[],expenses:[],savingGoal:0}
    const updated = type==='income' ? {...base,incomes:[...base.incomes,entry]} : {...base,expenses:[...base.expenses,entry]}
    await supabase.from('monthly_data').upsert({user_id:uid(),year:tY,month:tM,incomes:updated.incomes,expenses:updated.expenses,saving_goal:updated.savingGoal},{onConflict:'user_id,year,month'})
    if(same) setData(updated)
    if(!same) showToast(`📅 Guardado en ${MONTHS[tM]} ${tY}`)
    else showToast(type==='income'?'Ingreso añadido ✓':'Gasto añadido ✓')
  }

  const handleEditSave = async updated => {
    if(!editing) return
    const {type}=editing
    if(type==='income'){await saveMonth({...data,incomes:data.incomes.map(i=>i.id===updated.id?updated:i)});showToast('Ingreso actualizado ✓')}
    else if(type==='expense'){await saveMonth({...data,expenses:data.expenses.map(e=>e.id===updated.id?updated:e)});showToast('Gasto actualizado ✓')}
    else if(type==='savTx'){const diff=updated.amount-editing.item.amount;await saveSavings({...savings,transactions:savings.transactions.map(t=>t.id===updated.id?updated:t)});showToast('Actualizado ✓')}
    else if(type==='savDep'){const diff=updated.amount-editing.item.amount;await saveSavings({...savings,deposits:savings.deposits.map(d=>d.id===updated.id?updated:d)});showToast('Actualizado ✓')}
    else if(type==='apt'){await saveApt({...aptData,entries:aptData.entries.map(e=>e.id===updated.id?updated:e)});showToast('Actualizado ✓')}
    setEditing(null)
  }

  const transferToMain = async entry => {
    const newIncome={id:Date.now(),desc:entry.desc,amount:entry.amount,cat:'apartamentos',date:entry.date||today(),notes:entry.notes||'',tag:entry.tag||'',recurrent:false}
    await saveMonth({...data,incomes:[...data.incomes,newIncome]})
    await saveApt({...aptData,entries:aptData.entries.map(e=>e.id===entry.id?{...e,transferred:true}:e)})
    setConfirming(null); showToast(`✅ Traspasado a ingresos de ${MONTHS[month]} ${year}`)
  }

  const handleLogout = async () => { await supabase.auth.signOut() }

  if(authLoading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'system-ui',color:'#6b7280'}}>Cargando...</div>
  if(!session) return <Login/>
  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'system-ui',color:'#6b7280'}}>Cargando datos...</div>

  const totalInc=data.incomes.reduce((s,i)=>s+i.amount,0)
  const totalExp=data.expenses.reduce((s,e)=>s+e.amount,0)
  const goal=data.savingGoal||0
  const available=totalInc-totalExp-goal
  const health=available<0?'red':(available/Math.max(totalInc,1))>0.2?'green':'yellow'
  const totalDeps=(savings.deposits||[]).reduce((s,d)=>s+d.amount,0)
  const totalTxs=savings.transactions.reduce((s,t)=>s+t.amount,0)
  const currentBalance=savings.initialBalance+totalDeps-totalTxs
  const filteredApt=aptFilter==='todos'?aptData.entries:aptData.entries.filter(e=>e.apt===aptFilter)
  const aptIncomes=filteredApt.filter(e=>e.type==='ingreso')
  const aptExpenses=filteredApt.filter(e=>e.type==='gasto')
  const aptTotalInc=aptIncomes.reduce((s,e)=>s+e.amount,0)
  const aptTotalExp=aptExpenses.reduce((s,e)=>s+e.amount,0)
  const aptAllInc=aptData.entries.filter(e=>e.type==='ingreso').reduce((s,e)=>s+e.amount,0)
  const aptAllExp=aptData.entries.filter(e=>e.type==='gasto').reduce((s,e)=>s+e.amount,0)

  const advices=[]
  if(available<0) advices.push('⚠️ Estás gastando más de lo que ingresas.')
  else if(available<totalInc*0.1) advices.push('🟡 Tu margen libre es muy bajo.')
  else advices.push(`✅ Tienes ${fmt(available)} disponibles libremente.`)
  if(goal>0&&available>=0) advices.push(`💰 Vas camino de ahorrar ${fmt(goal)} este mes.`)
  if(currentBalance>0) advices.push(`🏦 Tu fondo de ahorros es ${fmt(currentBalance)}.`)
  if(totalInc===0) advices.push('📥 Añade tus ingresos para un análisis completo.')

  const theme={'--bg':dark?'#0f172a':'#f9fafb','--card':dark?'#1e293b':'#ffffff','--border':dark?'#334155':'#e5e7eb','--text':dark?'#f1f5f9':'#111827','--text2':dark?'#94a3b8':'#6b7280','--input-bg':dark?'#0f172a':'#ffffff'}
  const monthNav=dir=>{let m=month+dir,y=year;if(m<0){m=11;y--}if(m>11){m=0;y++}setMonth(m);setYear(y)}

  const BarChart=({items,total,budgetsMap})=>(
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {items.filter(c=>c.total>0).map(c=>(
        <div key={c.id}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:3,color:'var(--text)'}}><span>{c.icon} {c.label}</span><span style={{fontWeight:700}}>{fmt(c.total)} ({pct(c.total,total)}%)</span></div>
          <div style={{background:'var(--border)',borderRadius:99,height:8}}><div style={{width:`${pct(c.total,total)}%`,height:'100%',background:c.color||'#6366f1',borderRadius:99,transition:'width .4s'}}/></div>
          {budgetsMap&&budgetsMap[c.id]>0&&<div style={{fontSize:11,color:c.total>budgetsMap[c.id]?'#ef4444':'#10b981',marginTop:2}}>{c.total>budgetsMap[c.id]?`⚠️ Superado en ${fmt(c.total-budgetsMap[c.id])}`:`✅ ${fmt(budgetsMap[c.id]-c.total)} restante`}</div>}
        </div>
      ))}
    </div>
  )

  const DonutSummary=()=>{
    const r=60,cx=70,cy=70,circ=2*Math.PI*r,ep=pct(totalExp,totalInc)/100*circ,gp=pct(goal,totalInc)/100*circ
    return(<svg width={140} height={140}><circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={18}/><circle cx={cx} cy={cy} r={r} fill="none" stroke="#ef4444" strokeWidth={18} strokeDasharray={`${ep} ${circ-ep}`} strokeDashoffset={circ/4}/><circle cx={cx} cy={cy} r={r} fill="none" stroke="#6366f1" strokeWidth={18} strokeDasharray={`${gp} ${circ-gp}`} strokeDashoffset={circ/4-ep}/><text x={cx} y={cy-8} textAnchor="middle" fontSize={11} fill="var(--text2)">Disponible</text><text x={cx} y={cy+10} textAnchor="middle" fontSize={14} fontWeight="bold" fill={available>=0?'#10b981':'#ef4444'}>{fmt(available)}</text></svg>)
  }

  const VIEWS=['dashboard','ingresos','gastos','ahorros','apartamentos','análisis','calculadora','historial']
  const ICONS={dashboard:'📊',ingresos:'💚',gastos:'❤️',ahorros:'🏦',apartamentos:'🏢',análisis:'📈',calculadora:'🧮',historial:'📅'}

  return (
    <div style={{...theme,fontFamily:'system-ui,-apple-system,sans-serif',background:'var(--bg)',minHeight:'100vh',color:'var(--text)',maxWidth:820,margin:'0 auto',paddingBottom:40}}>
      {/* Header */}
      <div style={{background:'var(--card)',borderBottom:'1px solid var(--border)',padding:'14px 16px',position:'sticky',top:0,zIndex:10}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <span style={{fontWeight:800,fontSize:18}}>💰 Mi Presupuesto</span>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {saving&&<span style={{fontSize:11,color:'var(--text2)'}}>Guardando...</span>}
            <button onClick={()=>setDark(d=>!d)} style={{border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',borderRadius:8,padding:'5px 10px',cursor:'pointer',fontSize:14}}>{dark?'☀️':'🌙'}</button>
            <button onClick={handleLogout} style={{border:'1px solid var(--border)',background:'none',color:'var(--text2)',borderRadius:8,padding:'5px 10px',cursor:'pointer',fontSize:12,fontWeight:600}}>Salir</button>
          </div>
        </div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {VIEWS.map(v=><button key={v} onClick={()=>setView(v)} style={{padding:'6px 10px',borderRadius:8,cursor:'pointer',border:'none',background:view===v?(dark?'#6366f1':'#111827'):'transparent',color:view===v?'#fff':'var(--text2)',fontWeight:600,fontSize:12}}>{ICONS[v]} {v.charAt(0).toUpperCase()+v.slice(1)}</button>)}
        </div>
      </div>

      {view!=='historial'&&view!=='calculadora'&&view!=='apartamentos'&&(
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16,padding:'14px 16px 0'}}>
          <button onClick={()=>monthNav(-1)} style={{border:'none',background:'none',fontSize:22,cursor:'pointer',color:'var(--text2)'}}>‹</button>
          <span style={{fontWeight:700,fontSize:16}}>{MONTHS[month]} {year}</span>
          <button onClick={()=>monthNav(1)} style={{border:'none',background:'none',fontSize:22,cursor:'pointer',color:'var(--text2)'}}>›</button>
        </div>
      )}

      <div style={{padding:'14px 16px'}}>
        {/* DASHBOARD */}
        {view==='dashboard'&&(
          <div>
            <div style={{textAlign:'center',fontSize:13,color:'var(--text2)',marginBottom:10,fontWeight:600}}>{MONTHS[month]} {year}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
              {[{label:'Ingresos',val:totalInc,color:'#10b981',bg:dark?'#064e3b':'#ecfdf5',sub:`${data.incomes.length} registros`},{label:'Gastos',val:totalExp,color:'#ef4444',bg:dark?'#450a0a':'#fef2f2',sub:`${data.expenses.length} registros`},{label:'Meta ahorro',val:goal,color:'#6366f1',bg:dark?'#1e1b4b':'#eef2ff',sub:totalInc>0?`${pct(goal,totalInc)}% de ingresos`:'—'},{label:'Disponible',val:available,color:available>=0?'#10b981':'#ef4444',bg:available>=0?(dark?'#064e3b':'#ecfdf5'):(dark?'#450a0a':'#fef2f2'),sub:totalInc>0?`${pct(Math.max(0,available),totalInc)}% libre`:'—'}].map(c=>(
                <Card key={c.label} style={{background:c.bg,border:'none'}}><div style={{fontSize:12,color:'var(--text2)',marginBottom:2}}>{c.label}</div><div style={{fontSize:20,fontWeight:800,color:c.color}}>{fmt(c.val)}</div><div style={{fontSize:11,color:'var(--text2)',marginTop:3}}>{c.sub}</div></Card>
              ))}
            </div>
            <Card style={{marginBottom:14,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
              <DonutSummary/>
              <div style={{flex:1,minWidth:160}}>
                <div style={{fontWeight:700,marginBottom:4}}>Salud financiera</div>
                <div style={{fontSize:13,marginBottom:6}}>{health==='green'?'🟢 Buena':health==='yellow'?'🟡 Ajustada':'🔴 En riesgo'}</div>
                <div style={{background:'var(--border)',borderRadius:99,height:10,overflow:'hidden'}}><div style={{width:`${pct(totalExp+goal,totalInc)}%`,height:'100%',background:health==='green'?'#10b981':health==='yellow'?'#f59e0b':'#ef4444',borderRadius:99,transition:'width .4s'}}/></div>
                <div style={{fontSize:11,color:'var(--text2)',marginTop:4}}>{pct(totalExp+goal,totalInc)}% comprometido</div>
                {currentBalance>0&&<div style={{fontSize:13,color:'#6366f1',marginTop:8}}>🏦 Fondo: {fmt(currentBalance)}</div>}
              </div>
            </Card>
            <Card style={{marginBottom:14}}><div style={{fontWeight:700,marginBottom:10}}>💡 Consejos</div>{advices.map((a,i)=><div key={i} style={{fontSize:14,marginBottom:8,padding:'8px 12px',background:'var(--bg)',borderRadius:8,lineHeight:1.5}}>{a}</div>)}</Card>
            <Card><div style={{fontWeight:700,marginBottom:10}}>Meta de ahorro mensual</div><div style={{display:'flex',gap:8}}><Input placeholder={`Actual: ${fmt(goal)}`} type="number" value={goalF} onChange={e=>setGoalF(e.target.value)} style={{flex:1}}/><Btn onClick={async()=>{await saveMonth({...data,savingGoal:parseFloat(goalF)||0});setGoalF('');showToast('Meta guardada ✓');}}>Guardar</Btn></div></Card>
          </div>
        )}

        {/* INGRESOS */}
        {view==='ingresos'&&(
          <div>
            <Card style={{marginBottom:14}}>
              <div style={{fontWeight:700,marginBottom:12}}>Añadir ingreso</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                <Input placeholder="Descripción" value={incF.desc} onChange={e=>setIncF(f=>({...f,desc:e.target.value}))} style={{gridColumn:'1/-1'}}/>
                <Select value={incF.cat} onChange={e=>setIncF(f=>({...f,cat:e.target.value}))} style={{gridColumn:'1/-1'}}>{INCOME_CATS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</Select>
                <Input type="number" placeholder="Importe (€)" value={incF.amount} onChange={e=>setIncF(f=>({...f,amount:e.target.value}))}/>
                <Input type="date" value={incF.date} onChange={e=>setIncF(f=>({...f,date:e.target.value}))}/>
                <Input placeholder="Etiqueta" value={incF.tag} onChange={e=>setIncF(f=>({...f,tag:e.target.value}))}/>
                <Input placeholder="Notas" value={incF.notes} onChange={e=>setIncF(f=>({...f,notes:e.target.value}))}/>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}><input type="checkbox" checked={incF.recurrent} onChange={e=>setIncF(f=>({...f,recurrent:e.target.checked}))} style={{cursor:'pointer'}}/><label style={{fontSize:13,cursor:'pointer'}}>Recurrente mensual</label></div>
              <Btn color="#10b981" style={{width:'100%'}} onClick={async()=>{if(!incF.desc||!incF.amount)return;await saveEntryToCorrectMonth({id:Date.now(),...incF,amount:parseFloat(incF.amount)},'income');setIncF(emptyInc())}}>+ Añadir ingreso</Btn>
            </Card>
            {data.incomes.length>0&&<Card style={{marginBottom:14}}><div style={{fontWeight:700,marginBottom:10}}>Por categoría</div><BarChart items={INCOME_CATS.map(c=>({...c,total:data.incomes.filter(i=>i.cat===c.id).reduce((s,i)=>s+i.amount,0),color:'#10b981'}))} total={totalInc}/></Card>}
            <div style={{fontWeight:700,marginBottom:10}}>Total {MONTHS[month]}: {fmt(totalInc)}</div>
            {data.incomes.length===0&&<div style={{color:'var(--text2)',fontSize:14}}>Sin ingresos registrados.</div>}
            {data.incomes.map(i=>{const cat=INCOME_CATS.find(c=>c.id===i.cat)||INCOME_CATS[4];return(
              <Card key={i.id} style={{marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                  <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:14}}>{cat.icon} {i.desc}</div><div style={{fontSize:12,color:'var(--text2)'}}>{cat.label}{i.date?` · ${i.date}`:''}{i.tag?` · #${i.tag}`:''}{i.recurrent?' · 🔁':''}</div>{i.notes&&<div style={{fontSize:12,color:'var(--text2)'}}>📝 {i.notes}</div>}</div>
                  <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}><span style={{fontWeight:700,color:'#10b981'}}>{fmt(i.amount)}</span><ActionBtns onEdit={()=>setEditing({item:i,type:'income'})} onDelete={async()=>saveMonth({...data,incomes:data.incomes.filter(x=>x.id!==i.id)})}/></div>
                </div>
              </Card>
            )})}
          </div>
        )}

        {/* GASTOS */}
        {view==='gastos'&&(
          <div>
            <Card style={{marginBottom:14}}>
              <div style={{fontWeight:700,marginBottom:12}}>Añadir gasto</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                <Input placeholder="Descripción" value={expF.desc} onChange={e=>setExpF(f=>({...f,desc:e.target.value}))} style={{gridColumn:'1/-1'}}/>
                <Select value={expF.cat} onChange={e=>setExpF(f=>({...f,cat:e.target.value}))} style={{gridColumn:'1/-1'}}>{EXPENSE_CATS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</Select>
                <Input type="number" placeholder="Importe (€)" value={expF.amount} onChange={e=>setExpF(f=>({...f,amount:e.target.value}))}/>
                <Input type="date" value={expF.date} onChange={e=>setExpF(f=>({...f,date:e.target.value}))}/>
                <Input placeholder="Etiqueta" value={expF.tag} onChange={e=>setExpF(f=>({...f,tag:e.target.value}))}/>
                <Input placeholder="Notas" value={expF.notes} onChange={e=>setExpF(f=>({...f,notes:e.target.value}))}/>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}><input type="checkbox" checked={expF.recurrent} onChange={e=>setExpF(f=>({...f,recurrent:e.target.checked}))} style={{cursor:'pointer'}}/><label style={{fontSize:13,cursor:'pointer'}}>Recurrente mensual</label></div>
              <Btn color="#ef4444" style={{width:'100%'}} onClick={async()=>{if(!expF.desc||!expF.amount)return;await saveEntryToCorrectMonth({id:Date.now(),...expF,amount:parseFloat(expF.amount)},'expense');setExpF(emptyExp())}}>+ Añadir gasto</Btn>
            </Card>
            {data.expenses.length>0&&<Card style={{marginBottom:14}}><div style={{fontWeight:700,marginBottom:10}}>Por categoría</div><BarChart items={EXPENSE_CATS.map(c=>({...c,total:data.expenses.filter(e=>e.cat===c.id).reduce((s,e)=>s+e.amount,0)}))} total={totalExp} budgetsMap={budgets}/></Card>}
            <div style={{fontWeight:700,marginBottom:10}}>Total {MONTHS[month]}: {fmt(totalExp)}</div>
            {data.expenses.length===0&&<div style={{color:'var(--text2)',fontSize:14}}>Sin gastos registrados.</div>}
            {data.expenses.map(e=>{const cat=EXPENSE_CATS.find(c=>c.id===e.cat)||EXPENSE_CATS[9];return(
              <Card key={e.id} style={{marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                  <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:14}}>{cat.icon} {e.desc}</div><div style={{fontSize:12,color:'var(--text2)'}}>{cat.label}{e.date?` · ${e.date}`:''}{e.tag?` · #${e.tag}`:''}{e.recurrent?' · 🔁':''}</div>{e.notes&&<div style={{fontSize:12,color:'var(--text2)'}}>📝 {e.notes}</div>}</div>
                  <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}><span style={{fontWeight:700,color:'#ef4444'}}>{fmt(e.amount)}</span><ActionBtns onEdit={()=>setEditing({item:e,type:'expense'})} onDelete={async()=>saveMonth({...data,expenses:data.expenses.filter(x=>x.id!==e.id)})}/></div>
                </div>
              </Card>
            )})}
          </div>
        )}

        {/* AHORROS */}
        {view==='ahorros'&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
              <Card style={{background:dark?'#1e3a5f':'#eff6ff',border:'none'}}><div style={{fontSize:12,color:'var(--text2)',marginBottom:2}}>Saldo inicial</div><div style={{fontSize:20,fontWeight:800,color:'#3b82f6'}}>{fmt(savings.initialBalance||0)}</div></Card>
              <Card style={{background:dark?'#064e3b':'#ecfdf5',border:'none'}}><div style={{fontSize:12,color:'var(--text2)',marginBottom:2}}>Total aportaciones</div><div style={{fontSize:20,fontWeight:800,color:'#10b981'}}>{fmt(totalDeps)}</div></Card>
              <Card style={{background:dark?'#450a0a':'#fef2f2',border:'none'}}><div style={{fontSize:12,color:'var(--text2)',marginBottom:2}}>Total gastos del fondo</div><div style={{fontSize:20,fontWeight:800,color:'#ef4444'}}>{fmt(totalTxs)}</div></Card>
              <Card style={{background:dark?'#1e1b4b':'#eef2ff',border:'none'}}><div style={{fontSize:12,color:'var(--text2)',marginBottom:2}}>Saldo actual</div><div style={{fontSize:20,fontWeight:800,color:currentBalance>=0?'#6366f1':'#ef4444'}}>{fmt(currentBalance)}</div><div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>Inicial + aport. − gastos</div></Card>
            </div>
            <Card style={{marginBottom:14}}><div style={{fontWeight:700,marginBottom:10}}>Establecer saldo inicial</div><div style={{display:'flex',gap:8}}><Input type="number" placeholder={`Actual: ${fmt(savings.initialBalance||0)}`} value={savingInitial} onChange={e=>setSavingInitial(e.target.value)} style={{flex:1}}/><Btn color="#3b82f6" onClick={async()=>{if(!savingInitial)return;await saveSavings({...savings,initialBalance:parseFloat(savingInitial)});setSavingInitial('');showToast('Saldo inicial actualizado ✓')}}>Establecer</Btn></div></Card>
            <Card style={{marginBottom:14}}>
              <div style={{fontWeight:700,marginBottom:10}}>➕ Aportación</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                <Input placeholder="Descripción" value={savDepF.desc} onChange={e=>setSavDepF(f=>({...f,desc:e.target.value}))} style={{gridColumn:'1/-1'}}/>
                <Input type="number" placeholder="Importe (€)" value={savDepF.amount} onChange={e=>setSavDepF(f=>({...f,amount:e.target.value}))}/>
                <Input type="date" value={savDepF.date} onChange={e=>setSavDepF(f=>({...f,date:e.target.value}))}/>
              </div>
              <Btn color="#10b981" style={{width:'100%'}} onClick={async()=>{if(!savDepF.desc||!savDepF.amount)return;const amt=parseFloat(savDepF.amount);await saveSavings({...savings,deposits:[...(savings.deposits||[]),{id:Date.now(),...savDepF,amount:amt}]});setSavDepF({desc:'',amount:'',date:today()});showToast('Aportación registrada ✓')}}>+ Añadir aportación</Btn>
            </Card>
            <Card style={{marginBottom:14}}>
              <div style={{fontWeight:700,marginBottom:10}}>➖ Gasto del fondo</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                <Input placeholder="Descripción" value={savExpF.desc} onChange={e=>setSavExpF(f=>({...f,desc:e.target.value}))} style={{gridColumn:'1/-1'}}/>
                <Input type="number" placeholder="Importe (€)" value={savExpF.amount} onChange={e=>setSavExpF(f=>({...f,amount:e.target.value}))}/>
                <Input type="date" value={savExpF.date} onChange={e=>setSavExpF(f=>({...f,date:e.target.value}))}/>
                <Input placeholder="Notas" value={savExpF.notes} onChange={e=>setSavExpF(f=>({...f,notes:e.target.value}))} style={{gridColumn:'1/-1'}}/>
              </div>
              <Btn color="#ef4444" style={{width:'100%'}} onClick={async()=>{if(!savExpF.desc||!savExpF.amount)return;const amt=parseFloat(savExpF.amount);if(amt>currentBalance){showToast('Saldo insuficiente','err');return}await saveSavings({...savings,transactions:[...savings.transactions,{id:Date.now(),...savExpF,amount:amt}]});setSavExpF({desc:'',amount:'',date:today(),notes:''});showToast('Gasto registrado ✓')}}>- Registrar gasto</Btn>
            </Card>
            {savings.transactions.length>0&&<Card style={{marginBottom:14}}><div style={{fontWeight:700,marginBottom:10}}>Gastos del fondo</div>{savings.transactions.slice().reverse().map(t=>(<div key={t.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)',gap:8}}><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{t.desc}</div><div style={{fontSize:12,color:'var(--text2)'}}>{t.date}{t.notes?` · ${t.notes}`:''}</div></div><div style={{display:'flex',gap:8,alignItems:'center'}}><span style={{fontWeight:700,color:'#ef4444'}}>-{fmt(t.amount)}</span><ActionBtns onEdit={()=>setEditing({item:t,type:'savTx'})} onDelete={async()=>saveSavings({...savings,transactions:savings.transactions.filter(x=>x.id!==t.id)})}/></div></div>))}</Card>}
            {(savings.deposits||[]).length>0&&<Card><div style={{fontWeight:700,marginBottom:10}}>Aportaciones</div>{savings.deposits.slice().reverse().map(t=>(<div key={t.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)',gap:8}}><div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{t.desc}</div><div style={{fontSize:12,color:'var(--text2)'}}>{t.date}</div></div><div style={{display:'flex',gap:8,alignItems:'center'}}><span style={{fontWeight:700,color:'#10b981'}}>+{fmt(t.amount)}</span><ActionBtns onEdit={()=>setEditing({item:t,type:'savDep'})} onDelete={async()=>saveSavings({...savings,deposits:savings.deposits.filter(x=>x.id!==t.id)})}/></div></div>))}</Card>}
          </div>
        )}

        {/* APARTAMENTOS */}
        {view==='apartamentos'&&(
          <div>
            <Card style={{marginBottom:14}}>
              <div style={{fontWeight:700,marginBottom:10}}>🏢 Gestión de apartamentos</div>
              <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>{aptList.map(a=><span key={a} style={{background:dark?'#334155':'#f3f4f6',padding:'4px 10px',borderRadius:99,fontSize:13,fontWeight:600}}>{a}</span>)}</div>
              <div style={{display:'flex',gap:8}}><Input placeholder="Nuevo apartamento" value={newAptName} onChange={e=>setNewAptName(e.target.value)} style={{flex:1}}/><Btn color="#6366f1" onClick={async()=>{if(!newAptName.trim())return;const nl=[...aptList,newAptName.trim()];await saveAptList(nl);setNewAptName('');showToast(`"${newAptName.trim()}" añadido ✓`)}}>+ Añadir</Btn></div>
            </Card>
            <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
              {['todos',...aptList].map(a=><button key={a} onClick={()=>setAptFilter(a)} style={{padding:'6px 12px',borderRadius:99,cursor:'pointer',fontWeight:600,fontSize:13,background:aptFilter===a?(dark?'#6366f1':'#111827'):'var(--card)',color:aptFilter===a?'#fff':'var(--text2)',border:`1px solid ${aptFilter===a?'transparent':'var(--border)'}`}}>{a==='todos'?'🏢 Todos':a}</button>)}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:14}}>
              {[{label:'Ingresos',val:aptTotalInc,color:'#10b981',bg:dark?'#064e3b':'#ecfdf5'},{label:'Gastos',val:aptTotalExp,color:'#ef4444',bg:dark?'#450a0a':'#fef2f2'},{label:'Balance',val:aptTotalInc-aptTotalExp,color:(aptTotalInc-aptTotalExp)>=0?'#10b981':'#ef4444',bg:(aptTotalInc-aptTotalExp)>=0?(dark?'#064e3b':'#ecfdf5'):(dark?'#450a0a':'#fef2f2')}].map(c=>(
                <Card key={c.label} style={{background:c.bg,border:'none',padding:12}}><div style={{fontSize:11,color:'var(--text2)',marginBottom:3}}>{c.label}</div><div style={{fontSize:16,fontWeight:800,color:c.color}}>{fmt(c.val)}</div></Card>
              ))}
            </div>
            {(aptIncomes.length>0||aptExpenses.length>0)&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
                {aptIncomes.length>0&&<Card><div style={{fontWeight:700,marginBottom:10,color:'#10b981'}}>💚 Por categoría</div><CatSummary entries={aptIncomes} cats={APT_INCOME_CATS} colorDefault="#10b981" total={aptTotalInc}/></Card>}
                {aptExpenses.length>0&&<Card><div style={{fontWeight:700,marginBottom:10,color:'#ef4444'}}>❤️ Por categoría</div><CatSummary entries={aptExpenses} cats={APT_EXPENSE_CATS} colorDefault="#ef4444" total={aptTotalExp}/></Card>}
              </div>
            )}
            <Card style={{marginBottom:14}}>
              <div style={{fontWeight:700,marginBottom:12}}>Añadir registro</div>
              <div style={{display:'flex',gap:8,marginBottom:8}}>
                <button onClick={()=>setAptF(f=>({...f,type:'ingreso',cat:'alquiler_mensual'}))} style={{flex:1,padding:'8px',borderRadius:8,border:`2px solid ${aptF.type==='ingreso'?'#10b981':'var(--border)'}`,background:aptF.type==='ingreso'?(dark?'#064e3b':'#ecfdf5'):'transparent',color:aptF.type==='ingreso'?'#10b981':'var(--text2)',fontWeight:700,cursor:'pointer',fontSize:13}}>💚 Ingreso</button>
                <button onClick={()=>setAptF(f=>({...f,type:'gasto',cat:'otros_apt'}))} style={{flex:1,padding:'8px',borderRadius:8,border:`2px solid ${aptF.type==='gasto'?'#ef4444':'var(--border)'}`,background:aptF.type==='gasto'?(dark?'#450a0a':'#fef2f2'):'transparent',color:aptF.type==='gasto'?'#ef4444':'var(--text2)',fontWeight:700,cursor:'pointer',fontSize:13}}>❤️ Gasto</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                <Select value={aptF.apt} onChange={e=>setAptF(f=>({...f,apt:e.target.value}))} style={{gridColumn:'1/-1'}}>{aptList.map(a=><option key={a} value={a}>{a}</option>)}</Select>
                <Select value={aptF.cat} onChange={e=>setAptF(f=>({...f,cat:e.target.value}))} style={{gridColumn:'1/-1'}}>{(aptF.type==='ingreso'?APT_INCOME_CATS:APT_EXPENSE_CATS).map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</Select>
                <Input placeholder="Descripción" value={aptF.desc} onChange={e=>setAptF(f=>({...f,desc:e.target.value}))} style={{gridColumn:'1/-1'}}/>
                <Input type="number" placeholder="Importe (€)" value={aptF.amount} onChange={e=>setAptF(f=>({...f,amount:e.target.value}))}/>
                <Input type="date" value={aptF.date} onChange={e=>setAptF(f=>({...f,date:e.target.value}))}/>
                <Input placeholder="Etiqueta" value={aptF.tag} onChange={e=>setAptF(f=>({...f,tag:e.target.value}))}/>
                <Input placeholder="Notas" value={aptF.notes} onChange={e=>setAptF(f=>({...f,notes:e.target.value}))}/>
              </div>
              <Btn color={aptF.type==='ingreso'?'#10b981':'#ef4444'} style={{width:'100%'}} onClick={async()=>{if(!aptF.desc||!aptF.amount)return;await saveApt({...aptData,entries:[...aptData.entries,{id:Date.now(),...aptF,amount:parseFloat(aptF.amount),transferred:false}]});setAptF(emptyAptEntry(aptList));showToast('Registro añadido ✓')}}>+ Añadir registro</Btn>
            </Card>
            {aptIncomes.length>0&&<Card style={{marginBottom:14}}><div style={{fontWeight:700,marginBottom:10,color:'#10b981'}}>💚 Ingresos — {fmt(aptTotalInc)}</div>{aptIncomes.map(e=>{const cat=APT_INCOME_CATS.find(c=>c.id===e.cat)||APT_INCOME_CATS[5];return(<div key={e.id} style={{padding:'10px 0',borderBottom:'1px solid var(--border)'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:14}}>{cat.icon} {e.desc}</div><div style={{fontSize:12,color:'var(--text2)'}}>{e.apt} · {cat.label}{e.date?` · ${e.date}`:''}{e.tag?` · #${e.tag}`:''}</div>{e.notes&&<div style={{fontSize:12,color:'var(--text2)'}}>📝 {e.notes}</div>}{e.transferred&&<div style={{fontSize:11,color:'#6366f1',marginTop:2}}>✅ Traspasado</div>}</div><div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end',flexShrink:0}}><span style={{fontWeight:700,color:'#10b981'}}>{fmt(e.amount)}</span><ActionBtns onEdit={()=>setEditing({item:e,type:'apt'})} onDelete={async()=>saveApt({...aptData,entries:aptData.entries.filter(x=>x.id!==e.id)})}/></div></div></div>)})}</Card>}
            {aptExpenses.length>0&&<Card style={{marginBottom:14}}><div style={{fontWeight:700,marginBottom:10,color:'#ef4444'}}>❤️ Gastos — {fmt(aptTotalExp)}</div>{aptExpenses.map(e=>{const cat=APT_EXPENSE_CATS.find(c=>c.id===e.cat)||APT_EXPENSE_CATS[7];return(<div key={e.id} style={{padding:'10px 0',borderBottom:'1px solid var(--border)'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:14}}>{cat.icon} {e.desc}</div><div style={{fontSize:12,color:'var(--text2)'}}>{e.apt} · {cat.label}{e.date?` · ${e.date}`:''}{e.tag?` · #${e.tag}`:''}</div>{e.notes&&<div style={{fontSize:12,color:'var(--text2)'}}>📝 {e.notes}</div>}{e.transferred&&<div style={{fontSize:11,color:'#6366f1',marginTop:2}}>✅ Traspasado</div>}</div><div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end',flexShrink:0}}><span style={{fontWeight:700,color:'#ef4444'}}>{fmt(e.amount)}</span><div style={{display:'flex',gap:4}}>{!e.transferred&&<button onClick={()=>setConfirming(e)} style={{border:'1px solid #6366f1',background:'none',color:'#6366f1',borderRadius:7,padding:'3px 7px',cursor:'pointer',fontSize:12,fontWeight:600,whiteSpace:'nowrap'}}>🔄 Pasar a app</button>}<ActionBtns onEdit={()=>setEditing({item:e,type:'apt'})} onDelete={async()=>saveApt({...aptData,entries:aptData.entries.filter(x=>x.id!==e.id)})}/></div></div></div></div>)})}</Card>}
          </div>
        )}

        {/* ANÁLISIS */}
        {view==='análisis'&&(
          <div>
            <Card style={{marginBottom:14}}><div style={{fontWeight:700,marginBottom:12}}>Gastos por categoría</div>{data.expenses.length===0?<div style={{color:'var(--text2)',fontSize:14}}>Sin datos aún.</div>:<BarChart items={EXPENSE_CATS.map(c=>({...c,total:data.expenses.filter(e=>e.cat===c.id).reduce((s,e)=>s+e.amount,0)}))} total={totalExp} budgetsMap={budgets}/>}</Card>
            <Card style={{marginBottom:14}}>
              <div style={{fontWeight:700,marginBottom:12}}>🎯 Presupuesto por categoría</div>
              {EXPENSE_CATS.map(c=>(<div key={c.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><span style={{fontSize:13,width:170,flexShrink:0}}>{c.icon} {c.label}</span><Input type="number" placeholder="Límite €" value={budgetEdit[c.id]||budgets[c.id]||''} onChange={e=>setBudgetEdit(b=>({...b,[c.id]:e.target.value}))} style={{flex:1,padding:'5px 8px',fontSize:13}}/></div>))}
              <Btn style={{width:'100%',marginTop:4}} onClick={async()=>{const nb={};Object.entries(budgetEdit).forEach(([k,v])=>{if(v)nb[k]=parseFloat(v)});await saveBudgets({...budgets,...nb});showToast('Presupuestos guardados ✓')}}>Guardar presupuestos</Btn>
            </Card>
            <Card style={{marginBottom:14}}>
              <div style={{fontWeight:700,marginBottom:12}}>Resumen financiero</div>
              {[['Ingresos totales',fmt(totalInc),'#10b981'],['Gastos totales',fmt(totalExp),'#ef4444'],['Meta de ahorro',fmt(goal),'#6366f1'],['Saldo disponible',fmt(available),available>=0?'#10b981':'#ef4444'],['Fondo de ahorros',fmt(currentBalance),'#3b82f6'],['Apartamentos — Ingresos',fmt(aptAllInc),'#10b981'],['Apartamentos — Gastos',fmt(aptAllExp),'#ef4444'],['Apartamentos — Balance',fmt(aptAllInc-aptAllExp),(aptAllInc-aptAllExp)>=0?'#10b981':'#ef4444']].map(([l,v,c])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)'}}><span style={{fontSize:14}}>{l}</span><span style={{fontWeight:700,color:c}}>{v}</span></div>
              ))}
            </Card>
            <Card><div style={{fontWeight:700,marginBottom:10}}>💡 Consejos</div>{advices.map((a,i)=><div key={i} style={{fontSize:14,marginBottom:8,padding:'8px 12px',background:'var(--bg)',borderRadius:8,lineHeight:1.5}}>{a}</div>)}</Card>
          </div>
        )}

        {/* CALCULADORA */}
        {view==='calculadora'&&(
          <div><Card>
            <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
              {['hipoteca','préstamo','emergencia'].map(t=><button key={t} onClick={()=>setCalcTab(t)} style={{padding:'6px 14px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:700,fontSize:13,background:calcTab===t?(dark?'#6366f1':'#111827'):'var(--bg)',color:calcTab===t?'#fff':'var(--text2)'}}>{t==='hipoteca'?'🏠 Hipoteca':t==='préstamo'?'💳 Préstamo':'🛡️ Emergencia'}</button>)}
            </div>
            {calcTab==='hipoteca'&&(()=>{const r=calc.rate/100/12,n=calc.years*12,cap=calc.capital,cu=r===0?cap/n:cap*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1),tot=cu*n;return(<div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}><div><div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>Capital (€)</div><Input type="number" value={calc.capital} onChange={e=>setCalc(c=>({...c,capital:+e.target.value}))} style={{width:'100%',boxSizing:'border-box'}}/></div><div><div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>Interés (%)</div><Input type="number" step="0.1" value={calc.rate} onChange={e=>setCalc(c=>({...c,rate:+e.target.value}))} style={{width:'100%',boxSizing:'border-box'}}/></div><div><div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>Años</div><Input type="number" value={calc.years} onChange={e=>setCalc(c=>({...c,years:+e.target.value}))} style={{width:'100%',boxSizing:'border-box'}}/></div></div><div style={{background:'var(--bg)',borderRadius:10,padding:14}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span>Cuota mensual</span><span style={{fontWeight:800,fontSize:18,color:'#6366f1'}}>{fmt(cu)}</span></div><div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span>Total pagado</span><span style={{fontWeight:700,color:'#ef4444'}}>{fmt(tot)}</span></div><div style={{display:'flex',justifyContent:'space-between'}}><span>Intereses</span><span style={{fontWeight:700,color:'#f59e0b'}}>{fmt(tot-cap)}</span></div></div></div>)})()}
            {calcTab==='préstamo'&&(()=>{const r=calc.lrate/100/12,n=calc.lyears*12,cap=calc.loan,cu=r===0?cap/n:cap*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1),tot=cu*n;return(<div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}><div><div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>Importe (€)</div><Input type="number" value={calc.loan} onChange={e=>setCalc(c=>({...c,loan:+e.target.value}))} style={{width:'100%',boxSizing:'border-box'}}/></div><div><div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>Interés (%)</div><Input type="number" step="0.1" value={calc.lrate} onChange={e=>setCalc(c=>({...c,lrate:+e.target.value}))} style={{width:'100%',boxSizing:'border-box'}}/></div><div><div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>Años</div><Input type="number" value={calc.lyears} onChange={e=>setCalc(c=>({...c,lyears:+e.target.value}))} style={{width:'100%',boxSizing:'border-box'}}/></div></div><div style={{background:'var(--bg)',borderRadius:10,padding:14}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span>Cuota mensual</span><span style={{fontWeight:800,fontSize:18,color:'#6366f1'}}>{fmt(cu)}</span></div><div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span>Total pagado</span><span style={{fontWeight:700,color:'#ef4444'}}>{fmt(tot)}</span></div><div style={{display:'flex',justifyContent:'space-between'}}><span>Intereses</span><span style={{fontWeight:700,color:'#f59e0b'}}>{fmt(tot-cap)}</span></div></div></div>)})()}
            {calcTab==='emergencia'&&(<div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}><div><div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>Gastos mensuales (€)</div><Input type="number" value={totalExp||2000} readOnly style={{width:'100%',boxSizing:'border-box',opacity:.7}}/></div><div><div style={{fontSize:12,color:'var(--text2)',marginBottom:4}}>Meses cobertura</div><Input type="number" value={calc.emergency} onChange={e=>setCalc(c=>({...c,emergency:+e.target.value}))} style={{width:'100%',boxSizing:'border-box'}}/></div></div><div style={{background:'var(--bg)',borderRadius:10,padding:14}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span>Fondo necesario</span><span style={{fontWeight:800,fontSize:18,color:'#6366f1'}}>{fmt((totalExp||2000)*calc.emergency)}</span></div><div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span>Tienes ahorrado</span><span style={{fontWeight:700,color:'#3b82f6'}}>{fmt(currentBalance)}</span></div><div style={{display:'flex',justifyContent:'space-between'}}><span>Te falta</span><span style={{fontWeight:700,color:currentBalance>=(totalExp||2000)*calc.emergency?'#10b981':'#ef4444'}}>{fmt(Math.max(0,(totalExp||2000)*calc.emergency-currentBalance))}</span></div></div></div>)}
          </Card></div>
        )}

        {/* HISTORIAL */}
        {view==='historial'&&(()=>{
          const totalAcumInc=history.reduce((s,h)=>s+(h.incomes||[]).reduce((a,i)=>a+i.amount,0),0)
          const totalAcumExp=history.reduce((s,h)=>s+(h.expenses||[]).reduce((a,e)=>a+e.amount,0),0)
          const totalAcumGoal=history.reduce((s,h)=>s+(h.saving_goal||0),0)
          const totalAcumAv=totalAcumInc-totalAcumExp-totalAcumGoal
          return(
            <div>
              {history.length>0&&(
                <Card style={{marginBottom:16,background:dark?'#1e1b4b':'#eef2ff',border:'none'}}>
                  <div style={{fontWeight:800,marginBottom:12,fontSize:15}}>📊 Totales acumulados ({history.length} meses)</div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    {[{label:'Total ingresos',val:totalAcumInc,color:'#10b981'},{label:'Total gastos',val:totalAcumExp,color:'#ef4444'},{label:'Total ahorro planificado',val:totalAcumGoal,color:'#6366f1'},{label:'Resultado acumulado',val:totalAcumAv,color:totalAcumAv>=0?'#10b981':'#ef4444'}].map(c=>(
                      <div key={c.label} style={{background:'var(--card)',borderRadius:10,padding:12,border:'1px solid var(--border)'}}><div style={{fontSize:11,color:'var(--text2)',marginBottom:2}}>{c.label}</div><div style={{fontSize:17,fontWeight:800,color:c.color}}>{fmt(c.val)}</div></div>
                    ))}
                  </div>
                </Card>
              )}
              <div style={{fontWeight:700,marginBottom:12}}>Detalle por mes</div>
              {history.length===0&&<div style={{color:'var(--text2)',fontSize:14}}>Sin historial aún.</div>}
              {history.map(h=>{const inc=(h.incomes||[]).reduce((s,i)=>s+i.amount,0),exp=(h.expenses||[]).reduce((s,e)=>s+e.amount,0),av=inc-exp-(h.saving_goal||0);return(
                <Card key={h.id} style={{marginBottom:10}}>
                  <div style={{fontWeight:700,marginBottom:8}}>{MONTHS[h.month]} {h.year}</div>
                  <div style={{display:'flex',gap:16,flexWrap:'wrap',fontSize:13}}><span style={{color:'#10b981'}}>↑ {fmt(inc)}</span><span style={{color:'#ef4444'}}>↓ {fmt(exp)}</span><span style={{color:av>=0?'#6366f1':'#ef4444'}}>= {fmt(av)}</span></div>
                  <div style={{marginTop:8}}><div style={{background:'var(--border)',borderRadius:99,height:6}}><div style={{width:`${pct(exp,inc)}%`,height:'100%',background:av>=0?'#10b981':'#ef4444',borderRadius:99}}/></div></div>
                </Card>
              )})}
            </div>
          )
        })()}
      </div>

      {editing&&<EditModal item={editing.item} cats={editing.type==='income'?INCOME_CATS:editing.type==='expense'?EXPENSE_CATS:editing.type==='apt'?(editing.item.type==='ingreso'?APT_INCOME_CATS:APT_EXPENSE_CATS):null} aptList={editing.type==='apt'?aptList:null} onSave={handleEditSave} onClose={()=>setEditing(null)} dark={dark}/>}
      {confirming&&<ConfirmModal item={confirming} monthLabel={`${MONTHS[month]} ${year}`} onConfirm={()=>transferToMain(confirming)} onClose={()=>setConfirming(null)} dark={dark}/>}
      {toast&&<div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:toast.type==='err'?'#ef4444':'#111827',color:'#fff',padding:'10px 20px',borderRadius:99,fontSize:14,fontWeight:600,zIndex:300,whiteSpace:'nowrap'}}>{toast.msg}</div>}
    </div>
  )
}

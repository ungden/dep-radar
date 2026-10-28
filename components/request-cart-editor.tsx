"use client"
import { ADDONS, CATALOG, getTemplate, serviceQuantity } from '@/lib/catalog'
import { serviceLocationOpen } from '@/lib/launch'
import type { PricedCartItem } from '@/lib/service-cart'
import { Button, Card, inputClass } from './ui'

const choices = [...CATALOG,...ADDONS].filter(t => serviceLocationOpen(t,false) && !t.requiresVerification)
export function RequestCartEditor({ value,onChange }: {value: PricedCartItem[];onChange:(items: PricedCartItem[])=>void}) {
 const update=(index:number,patch:Partial<PricedCartItem>)=>onChange(value.map((item,i)=>i===index?{...item,...patch}:item))
 return <section className="space-y-3" aria-label="Các món thêm vào yêu cầu"><h2 className="font-bold">Dịch vụ thêm · cùng thợ, cùng chuyến</h2>
 {value.map((item,index)=>{const t=getTemplate(item.template)!,v=t.variants.find(v=>v.id===item.variant)!;return <Card className="space-y-2 p-3" key={index}>
 <select className={inputClass} aria-label={`Dịch vụ thêm ${index+1}`} value={t.id} onChange={e=>{const next=getTemplate(e.target.value)!,v=next.variants[0];update(index,{template:next.id,variant:v.id,quantity:serviceQuantity(v),unitPrice:v.suggestedPrice,region:undefined})}}>{choices.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
 <select className={inputClass} aria-label={`Lựa chọn thêm ${index+1}`} value={v.id} onChange={e=>{const next=t.variants.find(v=>v.id===e.target.value)!;update(index,{variant:next.id,quantity:serviceQuantity(next),unitPrice:next.suggestedPrice,region:undefined})}}>{t.variants.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</select>
 <input className={inputClass} aria-label={`Người nhận món ${index+1}`} maxLength={60} placeholder="Mình / Mẹ / Bạn 1" value={item.recipient??'Mình'} onChange={e=>update(index,{recipient:e.target.value})}/>
 {t.category==='nail'&&v.id!=='hand-foot'&&<select className={inputClass} aria-label={`Vùng móng món ${index+1}`} value={item.region??(t.id==='nail-pedicure'?'foot':'hand')} onChange={e=>update(index,{region:e.target.value as 'hand'|'foot'})}><option value="hand">Tay</option><option value="foot">Chân</option></select>}
 {v.perPerson&&<label className="block">Số {v.unit??'người'}<input className={inputClass} type="number" min={v.minQuantity??1} max={v.maxQuantity??1} value={item.quantity} onChange={e=>update(index,{quantity:serviceQuantity(v,Number(e.target.value))})}/></label>}
 <label className="block">Đơn giá<select className={inputClass} value={item.unitPrice} onChange={e=>update(index,{unitPrice:Number(e.target.value)})}>{v.tiers.map(price=><option key={price} value={price}>{price.toLocaleString('vi-VN')}đ/{v.unit??(v.perPerson?'người':'gói')}</option>)}</select></label>
 <Button variant="outline" type="button" onClick={()=>onChange(value.filter((_,i)=>i!==index))}>Xóa món</Button></Card>})}
 <Button variant="outline" type="button" disabled={value.length>=39} onClick={()=>{const t=choices.find(t=>t.id==='nail-prep-pilot')!,v=t.variants[0];onChange([...value,{template:t.id,variant:v.id,quantity:1,unitPrice:v.suggestedPrice,recipient:'Mình'}])}}>Thêm dịch vụ</Button></section>
}

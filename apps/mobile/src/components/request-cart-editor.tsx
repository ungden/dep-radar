import * as React from 'react'
import { TextInput,View } from 'react-native'
import { ADDONS,CATALOG,getTemplate,serviceQuantity,serviceLocationOpen,type PricedCartItem } from '@/shared'
import { Button } from '@/ui/button'
import { Card,Chip } from '@/ui/bits'
import { Txt } from '@/ui/text'
const choices=[...CATALOG,...ADDONS].filter(t=>serviceLocationOpen(t,false)&&!t.requiresVerification)
export function RequestCartEditor({value,onChange}:{value:PricedCartItem[];onChange:(items:PricedCartItem[])=>void}) {
 const [editing,setEditing]=React.useState<number|null>(null)
 const [search,setSearch]=React.useState('')
 const update=(index:number,patch:Partial<PricedCartItem>)=>onChange(value.map((item,i)=>i===index?{...item,...patch}:item))
 return <View style={{gap:12}}><Txt w={700}>Dịch vụ thêm · cùng thợ, cùng chuyến</Txt>{value.map((item,index)=>{const t=getTemplate(item.template)!,v=t.variants.find(v=>v.id===item.variant)!;return <Card key={index} style={{gap:8}}>
 <Button label={t.name} variant="secondary" onPress={()=>setEditing(editing===index?null:index)}/>
 {editing===index&&<View style={{gap:8}}><TextInput accessibilityLabel="Tìm dịch vụ" placeholder="Tìm dịch vụ" value={search} onChangeText={setSearch}/>{choices.filter(t=>t.name.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi'))).slice(0,12).map(t=><Button key={t.id} label={t.name} variant="ghost" onPress={()=>{const v=t.variants[0];update(index,{template:t.id,variant:v.id,quantity:serviceQuantity(v),unitPrice:v.suggestedPrice,region:undefined});setEditing(null);setSearch('')}}/>)}</View>}
 <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{t.variants.map(next=><Chip key={next.id} label={next.label} selected={v.id===next.id} onPress={()=>update(index,{variant:next.id,quantity:serviceQuantity(next),unitPrice:next.suggestedPrice,region:undefined})}/>)}</View>
 <TextInput accessibilityLabel={`Người nhận món ${index+1}`} placeholder="Mình / Mẹ / Bạn 1" value={item.recipient??'Mình'} maxLength={60} onChangeText={recipient=>update(index,{recipient})}/>
 {t.category==='nail'&&v.id!=='hand-foot'&&<View style={{flexDirection:'row',gap:8}}>{(['hand','foot'] as const).map(region=><Chip key={region} label={region==='hand'?'Tay':'Chân'} selected={(item.region??(t.id==='nail-pedicure'?'foot':'hand'))===region} onPress={()=>update(index,{region})}/>)}</View>}
 {v.perPerson&&<View style={{flexDirection:'row',gap:12,alignItems:'center'}}><Button compact label="−" variant="secondary" onPress={()=>update(index,{quantity:serviceQuantity(v,item.quantity-1)})}/><Txt>{item.quantity} {v.unit??'người'}</Txt><Button compact label="+" variant="secondary" onPress={()=>update(index,{quantity:serviceQuantity(v,item.quantity+1)})}/></View>}
 <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{v.tiers.map(price=><Chip key={price} label={`${price.toLocaleString('vi-VN')}đ`} selected={item.unitPrice===price} onPress={()=>update(index,{unitPrice:price})}/>)}</View>
 <Button label="Xóa món" variant="ghost" onPress={()=>onChange(value.filter((_,i)=>i!==index))}/></Card>})}
 <Button label="Thêm dịch vụ" variant="secondary" disabled={value.length>=39} onPress={()=>{const t=choices.find(t=>t.id==='nail-prep-pilot')!,v=t.variants[0];onChange([...value,{template:t.id,variant:v.id,quantity:1,unitPrice:v.suggestedPrice,recipient:'Mình'}])}}/></View>
}

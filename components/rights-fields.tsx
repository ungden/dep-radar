"use client"
import type { RightsAgreement } from '@/lib/commerce'
import { inputClass } from './ui'
export function RightsFields({value,onChange}:{value:RightsAgreement;onChange:(value:RightsAgreement)=>void}) {
 return <fieldset className="space-y-2"><legend className="font-semibold">Phạm vi sử dụng hình ảnh</legend>{([['buyer','Cá nhân/đơn vị sử dụng'],['channels','Kênh sử dụng (web, mạng xã hội…)'],['term','Thời hạn sử dụng'],['territory','Phạm vi địa lý']] as const).map(([key,label])=><label key={key} className="block text-body">{label}<input className={inputClass} value={value[key]} maxLength={300} onChange={e=>onChange({...value,[key]:e.target.value})}/></label>)}<label className="flex gap-2"><input type="checkbox" checked={value.paidAds} onChange={e=>onChange({...value,paidAds:e.target.checked})}/>Có sử dụng cho quảng cáo trả phí</label><label className="flex gap-2"><input type="checkbox" checked={value.exclusive} onChange={e=>onChange({...value,exclusive:e.target.checked})}/>Có yêu cầu độc quyền theo phạm vi đã ghi</label><p className="text-meta">Người làm xem phạm vi này trước khi nhận. Cho phép đăng portfolio là lựa chọn riêng.</p></fieldset>
}

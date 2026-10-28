import { TextInput,View } from 'react-native'
import type { RightsAgreement } from '@/shared'
import { Txt } from '@/ui/text'
import { Chip } from '@/ui/bits'
export function RightsFields({value,onChange}:{value:RightsAgreement;onChange:(value:RightsAgreement)=>void}) {
 return <View style={{gap:10}}><Txt w={700}>Phạm vi sử dụng hình ảnh</Txt>{([['buyer','Cá nhân/đơn vị sử dụng'],['channels','Kênh sử dụng (web, mạng xã hội…)'],['term','Thời hạn sử dụng'],['territory','Phạm vi địa lý']] as const).map(([key,label])=><View key={key}><Txt>{label}</Txt><TextInput accessibilityLabel={label} maxLength={300} value={value[key]} onChangeText={text=>onChange({...value,[key]:text})}/></View>)}<Chip label="Có quảng cáo trả phí" selected={value.paidAds} onPress={()=>onChange({...value,paidAds:!value.paidAds})}/><Chip label="Yêu cầu độc quyền theo phạm vi đã ghi" selected={value.exclusive} onPress={()=>onChange({...value,exclusive:!value.exclusive})}/></View>
}

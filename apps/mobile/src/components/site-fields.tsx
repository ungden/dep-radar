import {View} from 'react-native'
import {SITE_LABELS,type SiteFacilities,type ServiceSetup} from '@/shared'
import {Chip} from '@/ui/bits'
import {Txt} from '@/ui/text'
export function SiteFields({value,onChange,title='Điều kiện nơi làm có sẵn',requirements=[]}:{value:SiteFacilities;onChange:(value:SiteFacilities)=>void;title?:string;requirements?:(ServiceSetup|null|undefined)[]}){return <View style={{gap:8}}><Txt w={700}>{title}</Txt>{requirements.map((s,i)=>s&&<Txt key={i}>Đối tác chuẩn bị dụng cụ; nơi làm cần: {Object.entries(s.needs).filter(([,v])=>v).map(([key])=>SITE_LABELS[key as keyof typeof SITE_LABELS]).join(", ")||"không yêu cầu thêm"}. {s.note}</Txt>)}<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{(Object.keys(SITE_LABELS) as (keyof typeof SITE_LABELS)[]).map(key=><Chip key={key} label={SITE_LABELS[key]} selected={value[key]??false} onPress={()=>onChange({...value,[key]:!value[key]})}/>)}</View></View>}

import type { CartContractLine, PricedCartItem } from './service-cart'
export interface ScopeWorkspace {
 isPro:boolean;canChange:boolean;items:PricedCartItem[];startsAt:string;total:number
 proposals:{id:string;mine:boolean;status:string;reason:string;expires_at:string;total:number;duration_min:number;contract:{lines:CartContractLine[]}}[]
 versions:{id:string;service_price:number;created_at:string;contract:{lines?:CartContractLine[];serviceName:string}}[]
}
export interface DeliveryWorkspace {
 deliverables:{index:number;name:string;output:string;revisions:number;used:number}[];isPro:boolean;acceptedAt:string|null;dueAt:string|null;revisions:number;rights:Record<string,string|boolean>
 versions:{id:string;sequence:number;url:string;note:string;created_at:string}[]
 feedback:{id:string;feedback:string;correction:boolean;resolved_by:string|null}[]
}
export interface RightsAgreement { channels:string;term:string;territory:string;buyer:string;paidAds:boolean;exclusive:boolean }
export const EMPTY_RIGHTS: RightsAgreement={channels:'',term:'',territory:'Việt Nam',buyer:'',paidAds:false,exclusive:false}

import { describe, expect, it } from 'vitest'
import { cartConflict, cartItemTotal, validateCart, type CartItem } from '../lib/service-cart'
const line = (template: string, variant: string, recipient='Mình', region?: CartItem['region']): CartItem => ({template,variant,quantity:1,recipient, ...(region ? {region} : {})})
describe('scoped service cart', () => {
 it('caps cat-eye accents without changing the selected fingers',()=>{expect(cartItemTotal({...line('nail-art-pilot','cat-eye'),quantity:8},10000)).toBe(40000)})
 it('requires a main service before add-ons',()=>{expect(validateCart([line('nail-prep-pilot','biab')])).toBeTruthy()})
 it('rejects overlapping hand and hand-foot packages, permits different people', () => {
  expect(validateCart([line('nail-gel','hand'),line('nail-gel','hand-foot')])).toBeTruthy()
  expect(validateCart([line('nail-gel','hand'),line('nail-gel','hand','Mẹ')])).toBeNull()
 })
 it('permits separate hands and feet without losing included color', () => {
  expect(validateCart([line('nail-gel','hand','Mình','hand'),line('nail-gel','hand','Mình','foot')])).toBeNull()
  expect(validateCart([line('nail-extension','tips'),line('nail-gel','hand')])).toBeTruthy()
 })
 it('requires a matching recipient and region for nail art', () => {
  expect(validateCart([line('nail-design','stone')])).toBeTruthy()
  expect(validateCart([line('nail-pilot','gel'),line('nail-art-pilot','stone')])).toBeNull()
  expect(validateCart([line('nail-pilot','gel'),line('nail-art-pilot','stone','Mẹ')])).toBeTruthy()
 })
 it('does not charge bridal hair twice or stack makeup layouts', () => {
  expect(cartConflict(line('makeup-bridal','wedding'),line('makeup-hair-updo','updo'))).toBeTruthy()
  expect(cartConflict(line('makeup-daily','makeup'),line('makeup-party','makeup'))).toBeTruthy()
 })
 it('replaces massage duration and full/half wax, permits disjoint wax zones', () => {
  expect(cartConflict(line('massage-foot','60m'),line('massage-foot','90m'))).toBeTruthy()
  expect(cartConflict(line('skin-wax','half-leg'),line('skin-wax','full-leg'))).toBeTruthy()
  expect(validateCart([line('skin-wax','underarm'),line('skin-wax','half-leg')])).toBeNull()
 })
 it('supports more than three lines without permitting invalid counts', () => {
  expect(validateCart(Array.from({length:6},(_,i)=>line('nail-pilot','gel',`Bạn ${i}`)))).toBeNull()
  expect(validateCart([{...line('nail-art-pilot','stone'),quantity:100}])).toBeTruthy()
 })
})

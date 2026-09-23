-- The fee transfer's memo is "DEP" + the freelancer's pay code, written
-- together ("DEPAB23CD"), instead of "NAP AB23CD".
--
-- 360dep's bank account is shared with other businesses of the same company,
-- and "NAP" (nạp tiền) is what half of them write. SePay recognises payment
-- codes as 2-5 letters plus a suffix with no space; "DEP" + 6 letters/digits is
-- registered there, and the webhook only forwards transfers carrying it.
-- Nobody had paid with the old memo yet.

create or replace function public.record_bank_topup(p_content text, p_amount int, p_ref text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare code text; pro uuid;
begin
  -- Every DEP code in the memo, in turn; the lookahead keeps "DEPOSIT..." and
  -- longer words from passing for one.
  for code in
    select (regexp_matches(upper(coalesce(p_content, '')), 'DEP[^A-Z0-9]*([A-HJ-NP-Z2-9]{6})(?![A-Z0-9])', 'g'))[1]
  loop
    select id into pro from public.pros where pay_code = code;
    if pro is not null then
      return public.credit_topup(pro, p_amount, p_ref, 'Chuyển khoản DEP' || code);
    end if;
  end loop;
  return false;
end $$;

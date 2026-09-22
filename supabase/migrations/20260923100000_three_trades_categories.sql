-- Two new trades next to beauty: photo & video, and models.
--
-- A new enum value cannot be used in the transaction that adds it, and the CLI
-- runs each migration file as one transaction. So the values arrive alone, here,
-- and the catalogue that uses them follows in the next file.

alter type public.category_id add value if not exists 'photophone';
alter type public.category_id add value if not exists 'camera';
alter type public.category_id add value if not exists 'short-video';
alter type public.category_id add value if not exists 'product-photo';
alter type public.category_id add value if not exists 'model-photo';
alter type public.category_id add value if not exists 'model-video';

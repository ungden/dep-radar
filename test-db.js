import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ohjrocksurzkypcbfkha.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oanJvY2tzdXJ6a3lwY2Jma2hhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg2ODIzOCwiZXhwIjoyMDg4NDQ0MjM4fQ.nbniSu1YSb3DsCCUPQ7J1EWC3RVDNkJWUVtIzT2GRQo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Products:", data);
  }

  const { data: d2, error: e2 } = await supabase.from('kols').select('*').limit(1);
  if (e2) console.error("Error:", e2.message);
  else console.log("Kols:", d2);

  const { data: d3, error: e3 } = await supabase.from('reviews').select('*').limit(1);
  if (e3) console.error("Error:", e3.message);
  else console.log("Reviews:", d3);
}

check();

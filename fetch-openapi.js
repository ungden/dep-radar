const url = 'https://ohjrocksurzkypcbfkha.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oanJvY2tzdXJ6a3lwY2Jma2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NjgyMzgsImV4cCI6MjA4ODQ0NDIzOH0.h_hSgL72F0pZPV0UMjOeVbYeLZxHrJPaXyx59LPSMHs';

async function getOpenAPISpec() {
  const res = await fetch(url);
  const data = await res.json();
  console.log(Object.keys(data.paths));
}

getOpenAPISpec();

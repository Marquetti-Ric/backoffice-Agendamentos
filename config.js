// Configuração do backoffice.
// Sem supabaseUrl/supabaseAnonKey o sistema roda em modo demonstração, com dados só no navegador.
// A chave "anon" do Supabase é pública por natureza: o isolamento entre empresas é garantido pelas regras (RLS) do banco.
window.CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  nomePlataforma: "Backoffice",
  logoAcesso: "" // vazio usa o símbolo de exemplo
};

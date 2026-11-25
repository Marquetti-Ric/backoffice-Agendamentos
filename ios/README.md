# App iOS do Vivarium

App nativo mínimo (Swift + WKWebView) que abre o protótipo `Vivarium/www/index.html`, igual ao APK Android.
Não precisa de Mac: o workflow `.github/workflows/ios.yml` gera o projeto com XcodeGen e compila num Mac do GitHub Actions.

- Em qualquer branch: compila para o simulador, sem assinatura (confere se o código está ok).
- Na `main`, com os segredos da Apple configurados: assina pela nuvem da Apple e envia o build ao TestFlight.

## Configuração única (feita uma vez)

1. **Identificador do app** — developer.apple.com > Certificates, Identifiers & Profiles > Identifiers > **+** > App IDs > App.
   Bundle ID *Explicit*: `br.com.vivarium.app`. Se estiver ocupado, use outro e crie a variável `IOS_BUNDLE_ID` no GitHub (Settings > Secrets and variables > Actions > Variables).
2. **App no App Store Connect** — appstoreconnect.apple.com > Apps > **+** > New App. Plataforma iOS, nome (ex.: "Vivarium Spa"; precisa ser único na loja), idioma Português (Brasil), o Bundle ID acima e um SKU qualquer (ex.: `vivarium-app`). Isso não publica nada.
3. **Chave da API** — App Store Connect > Users and Access > Integrations > App Store Connect API > Team Keys > **+**. Acesso **Admin** (necessário para a Apple criar o certificado de distribuição sozinha). Baixe o arquivo `.p8` (só dá para baixar uma vez) e anote o **Key ID** e o **Issuer ID**.
4. **Team ID** — developer.apple.com/account > Membership details.
5. **Segredos no GitHub** — no repositório, Settings > Secrets and variables > Actions > New repository secret:

| Nome | Valor |
|---|---|
| `APPLE_TEAM_ID` | Team ID (10 caracteres) |
| `ASC_KEY_ID` | Key ID da chave |
| `ASC_ISSUER_ID` | Issuer ID |
| `ASC_KEY_P8` | conteúdo inteiro do arquivo `.p8`, incluindo as linhas BEGIN/END |

## Gerar um build

Actions > **App iOS** > Run workflow (na `main`), ou um push na `main` que mexa em `ios/`.
O número do build é o número da execução. Em 5 a 15 minutos ele aparece em App Store Connect > TestFlight.

## Instalar no iPhone

App Store Connect > o app > TestFlight > Internal Testing > crie um grupo e adicione seu usuário.
No iPhone, instale o app **TestFlight** da App Store e aceite o convite.

## Atualizar o conteúdo

Substitua `Vivarium/www/index.html` pela versão nova do protótipo (a mesma que vai no APK, com fontes embutidas) e faça push.

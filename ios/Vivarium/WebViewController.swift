import UIKit
import WebKit

/// Mostra o protótipo (www/index.html) em tela cheia, como o app Android.
final class WebViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    private var webView: WKWebView!

    private static let musgo = UIColor(red: 0x1F / 255, green: 0x33 / 255, blue: 0x24 / 255, alpha: 1)
    private static let fundo = UIColor(red: 0x15 / 255, green: 0x22 / 255, blue: 0x18 / 255, alpha: 1)

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = Self.musgo

        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.websiteDataStore = .default()

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = Self.fundo
        webView.scrollView.backgroundColor = Self.fundo
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsLinkPreview = false
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)

        // Topo abaixo da barra de status (o HTML não trata o recorte superior);
        // a base vai até a borda, porque o HTML já usa safe-area-inset-bottom.
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])

        if let pagina = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") {
            webView.loadFileURL(pagina, allowingReadAccessTo: pagina.deletingLastPathComponent())
        }
    }

    // Links externos (WhatsApp, telefone, e-mail, sites) abrem fora do app.
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { return decisionHandler(.allow) }
        if url.isFileURL || url.scheme == "about" || url.scheme == "data" || url.scheme == "blob" {
            return decisionHandler(.allow)
        }
        if action.navigationType == .linkActivated || action.targetFrame == nil {
            UIApplication.shared.open(url)
            return decisionHandler(.cancel)
        }
        decisionHandler(.allow)
    }

    // window.open / target="_blank"
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url { UIApplication.shared.open(url) }
        return nil
    }

    // alert() do JavaScript
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alerta = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alerta.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        present(alerta, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alerta = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alerta.addAction(UIAlertAction(title: "Cancelar", style: .cancel) { _ in completionHandler(false) })
        alerta.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
        present(alerta, animated: true)
    }

    // Se o processo da página cair (pouca memória), recarrega.
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.reload()
    }
}

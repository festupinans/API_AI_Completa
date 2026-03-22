import http.server
import socketserver
import os

PORT = 8000

class UnityWebGLHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Evitar problemas de caché durante el desarrollo
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        
        # Configurar headers para archivos comprimidos de Unity
        if self.path.endswith('.gz'):
            self.send_header('Content-Encoding', 'gzip')
        if self.path.endswith('.br'):
            self.send_header('Content-Encoding', 'br')
            
        super().end_headers()

    def guess_type(self, path):
        # Determinar el tipo MIME base
        base_type = super().guess_type(path)
        
        # Mapeo de tipos necesarios para WebGL
        if path.endswith('.wasm.gz') or path.endswith('.wasm.br'):
            return 'application/wasm'
        if path.endswith('.js.gz') or path.endswith('.js.br'):
            return 'application/javascript'
        if path.endswith('.data.gz') or path.endswith('.data.br'):
            return 'application/octet-stream'
            
        return base_type

print(f"Servidor iniciado en http://localhost:{PORT}")
with socketserver.TCPServer(("", PORT), UnityWebGLHandler) as httpd:
    httpd.serve_forever()
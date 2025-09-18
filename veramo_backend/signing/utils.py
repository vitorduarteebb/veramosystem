import base64
import hashlib
import hmac
import json
import os
import time
import io
from datetime import datetime, timezone as dtz
from django.conf import settings
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from PyPDF2 import PdfReader, PdfWriter

def sha256_file(fpath):
    """Calcula hash SHA-256 de um arquivo"""
    h = hashlib.sha256()
    with open(fpath, 'rb') as fp:
        for chunk in iter(lambda: fp.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()

def jws_sign(payload: dict) -> str:
    """Cria um JWS (JSON Web Signature) com HMAC-SHA256"""
    secret = getattr(settings, 'SIGNING_JWT_SECRET', 'default_secret_change_me').encode()
    header = {"alg": "HS256", "typ": "JWT"}
    
    def b64(x):
        return base64.urlsafe_b64encode(json.dumps(x, separators=(',', ':')).encode()).rstrip(b'=')
    
    signing_input = b'.'.join([b64(header), b64(payload)])
    sig = base64.urlsafe_b64encode(hmac.new(secret, signing_input, hashlib.sha256).digest()).rstrip(b'=')
    return (signing_input + b'.' + sig).decode()

def check_ttl(expires_at):
    """Verifica se um timestamp ainda é válido"""
    return expires_at and expires_at > datetime.now(dtz.utc)

def stamp_signature_block(pdf_in_path, pdf_out_path, blocks):
    """
    Estampa blocos de assinatura no PDF
    
    blocks = list of dicts:
      { "x":40, "y":100, "text_lines":[...], "page_index": -1 (ultima) }
    """
    try:
        base_reader = PdfReader(pdf_in_path)
        writer = PdfWriter()
        
        for i in range(len(base_reader.pages)):
            page = base_reader.pages[i]
            packet = io.BytesIO()
            c = canvas.Canvas(packet, pagesize=letter)
            
            for b in blocks:
                page_target = (len(base_reader.pages) - 1 if b.get("page_index", -1) == -1 else b["page_index"])
                if page_target == i:
                    y = b["y"]
                    for line in b["text_lines"]:
                        c.drawString(b["x"], y, line)
                        y -= 12
                    c.rect(b["x"] - 6, b["y"] - 6, 460, 16 * len(b["text_lines"]), stroke=1, fill=0)
            
            c.save()
            packet.seek(0)
            overlay = PdfReader(packet)
            page.merge_page(overlay.pages[0])
            writer.add_page(page)
        
        with open(pdf_out_path, 'wb') as fp:
            writer.write(fp)
        return True
    except Exception as e:
        print(f"Erro ao estampar PDF: {e}")
        return False

def generate_otp():
    """Gera um OTP de 6 dígitos"""
    import secrets
    return f"{secrets.randbelow(10**6):06d}"

def hash_otp(otp):
    """Gera hash SHA-256 do OTP"""
    return hashlib.sha256(otp.encode()).hexdigest()

def verify_otp(otp, otp_hash):
    """Verifica se o OTP confere com o hash"""
    return hash_otp(otp) == otp_hash

def generate_magic_token():
    """Gera token seguro para link mágico"""
    import secrets
    return secrets.token_urlsafe(48)

def hash_magic_token(token):
    """Gera hash SHA-256 do token mágico"""
    return hashlib.sha256(token.encode()).hexdigest()

def verify_magic_token(token, token_hash):
    """Verifica se o token mágico confere com o hash"""
    return hash_magic_token(token) == token_hash

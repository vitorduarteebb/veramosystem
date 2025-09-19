"""
ASGI config para projeto Veramo.

Expõe o ASGI callable como uma variável de nível de módulo chamada ``application``.

Para mais informações sobre este arquivo, veja:
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veramo_backend.settings')

application = get_asgi_application()

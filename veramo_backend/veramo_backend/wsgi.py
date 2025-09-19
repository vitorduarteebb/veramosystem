"""
WSGI config para projeto Veramo.

Expõe o WSGI callable como uma variável de nível de módulo chamada ``application``.

Para mais informações sobre este arquivo, veja:
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veramo_backend.settings')

application = get_wsgi_application()

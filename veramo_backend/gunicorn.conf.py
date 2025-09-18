"""
Configuração do Gunicorn para o Veramo3
Otimizado para produção
"""
import multiprocessing
import os

# Configurações básicas
bind = "127.0.0.1:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50

# Timeouts
timeout = 60
keepalive = 2
graceful_timeout = 30

# Logging
accesslog = "-"  # stdout para journald
errorlog = "-"   # stdout para journald
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "veramo"

# Preload app para melhor performance
preload_app = True

# Configurações de segurança
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Configurações de worker
worker_tmp_dir = "/dev/shm"  # Usar RAM para arquivos temporários
worker_exit_on_app_false = True

# Configurações de reload (desenvolvimento)
reload = os.environ.get("GUNICORN_RELOAD", "false").lower() == "true"

# Configurações de SSL (se necessário)
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile"

def when_ready(server):
    """Callback executado quando o servidor está pronto"""
    server.log.info("Veramo3 Gunicorn server is ready!")

def worker_int(worker):
    """Callback executado quando um worker é interrompido"""
    worker.log.info("Worker received INT or QUIT signal")

def pre_fork(server, worker):
    """Callback executado antes de criar um worker"""
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def post_fork(server, worker):
    """Callback executado após criar um worker"""
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def post_worker_init(worker):
    """Callback executado após inicializar um worker"""
    worker.log.info("Worker initialized (pid: %s)", worker.pid)

def worker_abort(worker):
    """Callback executado quando um worker é abortado"""
    worker.log.info("Worker aborted (pid: %s)", worker.pid) 
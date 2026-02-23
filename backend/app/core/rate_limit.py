"""
Shared rate-limiter instance (slowapi / limits).
Import `limiter` wherever you need @limiter.limit() decorators.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

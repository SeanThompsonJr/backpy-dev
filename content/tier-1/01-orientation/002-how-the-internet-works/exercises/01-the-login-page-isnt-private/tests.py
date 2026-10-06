from main import *


def test_an_https_address_is_secure():
    assert is_secure("https://poketeam.example/login") is True, \
        "An https:// address uses TLS, so it should count as secure. Does your check still accept it?"


def test_an_http_address_is_not_secure():
    assert is_secure("http://poketeam.example/login") is False, \
        "A plain http:// address was accepted. What do http:// and https:// have in common, and is that enough to tell them apart?"


def test_an_ftp_address_is_not_secure():
    assert is_secure("ftp://poketeam.example/files") is False, \
        "Only https:// means the connection is private. Which part of the address says that?"

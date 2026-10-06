# The login link that goes in every welcome email.
LOGIN_LINK = "http://poketeam.example/login"


def is_secure(url):
    # Only HTTPS keeps a password private on its way to the server.
    return url.startswith("https://")


if is_secure(LOGIN_LINK):
    print("Sending the welcome email.")
else:
    print("Refusing: the login link isn't private.")

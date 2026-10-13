def load_settings(env):
    # env holds PokeTeam's environment variables, the same way os.environ does.
    debug = env.get("DEBUG", "false").lower() == "true"
    port = int(env.get("PORT", "8000"))
    return {"debug": debug, "port": port}


print(load_settings({"DEBUG": "false", "PORT": "8080"}))

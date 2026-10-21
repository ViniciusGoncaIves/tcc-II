DO $$
DECLARE
	LSENHA	TEXT := ENCODE(GEN_RANDOM_BYTES(6), 'hex');
BEGIN
	INSERT INTO USUARIO (NOME, EMAIL, SENHA, TIPO_USUARIO)
	VALUES ('Administrador', 'adm@gmail.com', CRYPT(LSENHA, GEN_SALT('bf', 10)), 'ADMIN');
	RAISE NOTICE 'Senha provisória do administrador: %', LSENHA;
END $$;
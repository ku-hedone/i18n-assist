const t = (v: string) => v;

const Login = () => {
  const is_prod = process.env.PROD === 'prod';
  return (
    <div>
      <div>{is_prod ? t('A平台') : t('B平台')}</div>
      <form>
        <div>
          <label>{t('账号')}:</label>
          <input name="username" placeholder={t('请输入您的账号')} allowClear />
        </div>
        <div>
          <label>{t('密码')}:</label>
          <input name="password" placeholder={t('请输入您的密码')} allowClear />
        </div>
        <div>
          <button type="submit">{t('登录')}</button>
        </div>
      </form>
    </div>
  );
};

export default Login;

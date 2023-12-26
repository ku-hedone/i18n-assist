const t = (v: string) => v;

const NoFoundPage = () => {
  return (
    <div>
      <div>{t('对不起你访问的页面不存在。')}</div>
      <button>{t('返回首页')}</button>
    </div>
  );
};

export default NoFoundPage;

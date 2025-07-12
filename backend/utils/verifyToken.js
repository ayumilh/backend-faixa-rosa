let userId = '';

export const setUserId = async (req, res) => {
  try {
    // Recebendo userid do front-end
    const saveUserid = req.body.userid;
    // const saveUserid = req.user.id;

    console.log(saveUserid);

    // Aqui você poderia salvar o userId em memória se quiser (não recomendado em produção)
    userId = saveUserid;

    res.status(200).json({ message: `UserId: ${saveUserid}` });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ message: 'Erro ao processar a solicitação.' });
  }
};

export const getUserId = () => {
  return userId;
};

let userId = ''

exports.userId = async (req, res) => {
    try {
        console.log(req.body.userid)
        //recebendo userid do front end
        const saveUserid = req.body.userid;

        console.log(saveUserid)

        userId = saveUserid;

        console.log(userId)
        res.status(200).json({ message: `UserId: ${saveUserid}` });

    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao processar a solicitação.' });
    }
};

exports.GetUserId = () => {
    return userId;
};

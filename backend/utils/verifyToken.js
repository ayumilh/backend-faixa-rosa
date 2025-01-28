let userId = ''

exports.userId = async (req, res) => {
    try {
        //recebendo userid do front end
        const saveUserid = req.body.userid;
        // const saveUserid = req.user.id;
        
        console.log(saveUserid)

        res.status(200).json({ message: `UserId: ${saveUserid}` });

    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ message: 'Erro ao processar a solicitação.' });
    }
};

exports.GetUserId = () => {
    return userId;
};

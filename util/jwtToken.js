export function sendToken(user, statusCode, res){
    const token = user.GetToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    }

    res.statusCode(200).cookie("token", token, options).json({
        success:true,
        token,
        user
    })
}
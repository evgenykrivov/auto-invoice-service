export const getThirdPaymentEmailTemplate = (data: {
    total: number;
    plan: string;
    next_payment_date: string;
    user_id: string;
}) => `
<!doctype html>
<meta charset="utf-8">
<html>
<head>
    <style>
        .email-container {
            background-color: #F2F5F7;
            color: #242424;
            font-family: "Helvetica Neue", "Arial Nova", "Nimbus Sans", Arial, sans-serif;
            font-size: 16px;
            line-height: 1.5;
            margin: 0;
            padding: 32px 0;
            border-radius: 10px;
        }

        .email-table {
            margin: 0 auto;
            max-width: 600px;
            background-color: #FFFFFF;
            width: 100%;
            border: 0;
        }

        .footer-text {
            font-size: 16px;
            text-align: center;
            padding-bottom: 24px;
            background-color: #F2F5F7;
        }

        .welcome-text {
            padding: 0 24px 16px;
        }

        .important-notice {
            padding: 16px;
            background-color: #F0F0F0;
            border-left: 4px solid #FFC107;
            margin: 0 24px 16px;
        }

        .logo-container {
            padding: 24px;
        }

        .unsubscribe-section {
            background-color: #F2F5F7;
            border-radius: 8px;
            margin: 24px;
            padding: 16px;
        }

        .unsubscribe-list {
            margin: 8px 0;
            list-style-type: none;
            padding-left: 20px;
        }

        .unsubscribe-list li::before {
            content: "✔️";
            margin-right: 5px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <table class="email-table">
            <tbody>
                <tr>
                    <td>
                        <div class="logo-container">
                            <a href="https://chachat.neiro.ai" target="_blank">
                                <img alt="ChaChat" src="https://chachat.neiro.ai/storage/project/favicon_21.png" style="max-width:64px"/>
                            </a>
                        </div>
                        <div class="welcome-text">
                            <h2>Your third payment is coming up</h2>
                            <p>Your next payment of $${(data.total / 100).toFixed(2)} for ${data.plan} is scheduled for ${data.next_payment_date}.</p>
                        </div>
                        <div class="unsubscribe-section">
                            <center>
                                <h4 style="margin-top: 0;">How to unsubscribe?</h4>
                            </center>
                            <p>You can unsubscribe at any time by one of the following ways:</p>
                            <ul class="unsubscribe-list">
                                <li>by <a href="https://app.chachat.app/profile?id=${data.user_id}">managing your subscription</a></li>
                                <li>by <a href="mailto:contact@chachat.app?body=%0AMy activation code is: ${data.user_id}%0D%0A%0D%0A">writing us an email</a></li>
                                <li>through your Stripe / PayPal account</li>
                            </ul>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>
                        <center>
                            Questions? Just reply to this email or contact us at
                            <a href="mailto:contact@chachat.app?body=%0AMy activation code is: ${data.user_id}%0D%0A%0D%0A">contact@chachat.app</a>
                            We are here to help every step of the way!
                        </center>
                        <br/>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <div class="footer-text">
        <small>
            You received this email as a registered user of ChaChat<br/>
            Your subscription will automatically renew at the end of your current subscription period.<br/>
            Cancel any time in your account settings in the app or write us an email.<br/>
            769 Monterey Blvd Ste 5A, San Francisco, CA 94127<br/>
            <a href="https://chachat.neiro.ai/privacy-policy">Privacy Policy</a>
        </small>
    </div>
</body>
</html>
`; 
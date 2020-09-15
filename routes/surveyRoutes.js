const _ = require('lodash');
const { Path } = require('path-parser');
const { URL } = require('url');
const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');
const requireCredits = require('../middlewares/requireCredits');
const Mailer = require('../services/Mailer');
const surveyTemplate = require('../emailTemplates/surveyTemplate');

const Survey = mongoose.model('surveys');

module.exports = (app) => {
	app.get('/api/surveys/thanks', (req, res) => {
		res.send('Thanks for providing your feedback!');
	});

	app.post('/api/surveys', requireLogin, requireCredits, async (req, res) => {
		const { title, subject, body, recipients } = req.body;

		const survey = new Survey({
			title,
			subject,
			body,
			recipients: recipients.split(',').map((email) => ({ email: email.trim() })),
			_user: req.user.id,
			dateSent: Date.now(),
		});

		const mailer = new Mailer(survey, surveyTemplate(survey));

		try {
			await mailer.send();
			await survey.save();

			req.user.credits -= 1;
			const user = await req.user.save();

			res.send(user);
		} catch (err) {
			res.status(422).send(err);
		}
	});

	app.post('/api/surveys/webhooks', (req, res) => {
		const events = req.body.map(({ email, url }) => {
			const pathname = new URL(url).pathname;
			const p = new Path('/api/surveys/:surveyId/:choice');
			const match = p.test(pathname);

			if (match) {
				return {
					email,
					surveyId: match.surveyId,
					choice: match.choice,
				};
			}
		});
	});

	app.get('/api/surveys/webhooks', (req, res) => {
		console.log(req.body);
		res.send({});
	});
};

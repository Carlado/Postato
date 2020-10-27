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
	app.get('api/surveys', requireLogin, async (req, res) => {
		const surveys = await Survey.find({ _user: req.user.id });
		res.send(surveys);
	});

	app.get('/api/surveys/:surveyId/:choice', (req, res) => {
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
		const p = new Path('/api/surveys/:surveyId/:choice');

		const events = req.body.map(({ email, url }) => {
			const match = p.test(new URL(url).pathname);

			if (match) {
				return {
					email,
					surveyId: match.surveyId,
					choice: match.choice,
				};
			}
		});

		const compactEvents = events.filter(Boolean);
		const uniqueEvents = _.uniqBy(compactEvents, 'email', 'surveyId');

		uniqueEvents.forEach(({ surveyId, email, choice }) => {
			Survey.updateOne(
				{
					_id: surveyId,
					recipients: {
						$elemMatch: { email: email, responded: false },
					},
				},
				{
					$inc: { [choice]: 1 },
					$set: { 'recipients.$.responded': true },
					lastResponded: new Date(),
				}
			).exec();
		});

		res.send({});
	});

	app.get('/api/surveys/webhooks', (req, res) => {
		console.log(req.body);
		res.send({});
	});
};

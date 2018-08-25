import * as express from 'express';
import * as path from 'path';
import * as bodyParser from 'body-parser'; 
import setRouter from './controller';
import logger from './logger';

const { serverConfig } = require(path.normalize('../config/index.js'));

const app = express();

app.use(bodyParser.json({ limit: '50mb' })); // for parsing application/json
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // for parsing application/x-www-form-urlencoded

app.all('*', (req, resp, next) => {
	resp.setHeader('Access-Control-Allow-Origin', '*');
	resp.setHeader('Access-Control-Allow-Credentials', 'true');
	resp.setHeader('Access-Control-Allow-Methods', '*');
	resp.setHeader('Access-Control-Allow-Headers', '*');
	resp.setHeader('Access-Control-Expose-Headers', '*');
	next();
});

app.use(express.static('webapp'));

app.use((req, res, next) => {
	logger.info(req.headers);
	if (req.method.toLowerCase() === 'post') {
		logger.info(req.body);
	}
	next();
});

setRouter(app);

app.listen(serverConfig.port, () => {
	console.log(`server started on port ${serverConfig.port}`);
});

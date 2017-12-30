import * as exp from 'express';
import * as path from 'path';
import * as fallback from 'express-history-api-fallback/dist';

let app = exp();
let port = parseInt(process.env.PORT, 10) || 3001;
let publicPath = path.resolve(__dirname, 'public');

console.log(publicPath);
app.use('/static', exp.static(publicPath));
app.get(/\.(js|css|gif|jpe?g|png)$/, (req, res) => {
  res.status(404);
  res.send();
});
app.use(fallback('index.html', {root: publicPath}));

app.listen(port);

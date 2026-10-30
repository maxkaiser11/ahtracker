import { Response, Request } from 'express';
import express from 'express';
import { config } from 'dotenv';

const app = express();

app.get('/', (req: Request, res: Response) => {
  res.send({message: "Hello World"});
});


app.listen(3000, () => console.log('Listenting on port 3000'));

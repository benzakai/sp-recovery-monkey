import { ActionFunctionArgs } from "@remix-run/node";

let data;

export async function action({ request }: ActionFunctionArgs) {
        data = await request.json();
    try {
        console.log('data',data);
        
        return {status:'remix data',data};
    } catch (error) {
        console.error('Error fetching qr ', error);
        return { error: error.message };
    }
}


export async function loader({ request }: ActionFunctionArgs) {
 try {
     console.log('datalodaer',data);
     
     return {data};
 } catch (error) {
     console.error('Error fetching qr ', error);
     return { error: error.message };
 }
}



import { ActionFunctionArgs } from "@remix-run/node";

const partnerApiUrl = 'https://api.greenapi.com';
const partnerToken = 'gac.8fcbb1b93eca477ebca0084f7537e721ec829930442647';


function formatUrl(url) {
  // Remove trailing slash if it exists
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

let s=0;
export async function loader({ request }: ActionFunctionArgs) {

    try {
        // Fetch the instances
        const response = await fetch(`${partnerApiUrl}/partner/getInstances/${partnerToken}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
    
        // Parse the JSON response
        const instances = await response.json();
    
        // Log the response to inspect the structure
        // console.log('API response:', instances);
    
        // Check if the instances object contains an array (adjust this based on the response structure)
        if (!instances || !Array.isArray(instances)) {
          throw new Error('Invalid instances response: Expected an array of instances');
        }

        const filteredDeletedInstances = instances.filter(item => item.deleted == false);
    
        // Use Promise.all to fetch state for each instance
        const updatedInstances = await Promise.all(
          filteredDeletedInstances?.map(async (instance) => {
            try {
              // Normalize the apiUrl to ensure it doesn't have trailing or double slashes
              // const normalizedApiUrl = instance?.apiUrl.endsWith('/')
              //   ? instance.apiUrl.slice(0, -1)
              //   : instance.apiUrl;

              const normalizedApiUrl = formatUrl(instance?.apiUrl);
              s++;
              // console.log('normalizedApiUrl===================',normalizedApiUrl,s);
              // Construct the endpoint and fetch the state of the instance
              const stateResponse = await fetch(`${normalizedApiUrl}/waInstance${instance?.idInstance}/getWaSettings/${instance?.apiTokenInstance}`);
              const stateData = await stateResponse.json();
              
              
              // Add the state to the instance object
              instance.status = stateData?.stateInstance;
              instance.apiUrl = normalizedApiUrl;
              instance.avatar = stateData?.avatar || '';
              instance.phone = stateData?.phone || '';
            } catch (error) {
              console.error(`Error fetching state for instance ${instance.idInstance}:`, error);
              instance.status = 'Error'; // Handle individual instance errors without crashing the whole process
            }
            return instance;
          })
        );
        // console.log('hhh',updatedInstances);
        
        // Send the updated instances with their state
        return { instances: updatedInstances };
      } catch (error) {
        console.error('Error fetching instances or their state:', error);
        return { error: error.message };
      }
}
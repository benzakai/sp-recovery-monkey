import { ActionFunctionArgs } from "@remix-run/node";

const partnerApiUrl = 'https://api.greenapi.com';
const partnerToken = 'gac.8fcbb1b93eca477ebca0084f7537e721ec829930442647';

function formatUrl(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

let s = 0;
export async function loader({ request }: ActionFunctionArgs) {

  try {
    const response = await fetch(`${partnerApiUrl}/partner/getInstances/${partnerToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const instances = await response.json();

    if (!instances || !Array.isArray(instances)) {
      throw new Error('Invalid instances response: Expected an array of instances');
    }

    const filteredDeletedInstances = instances.filter(item => item.deleted == false);

    const updatedInstances = await Promise.all(
      filteredDeletedInstances?.map(async (instance) => {
        try {

          const normalizedApiUrl = formatUrl(instance?.apiUrl);
          s++;

          const stateResponse = await fetch(`${normalizedApiUrl}/waInstance${instance?.idInstance}/getWaSettings/${instance?.apiTokenInstance}`);
          const stateData = await stateResponse.json();

          instance.status = stateData?.stateInstance;
          instance.apiUrl = normalizedApiUrl;
          instance.avatar = stateData?.avatar || '';
          instance.phone = stateData?.phone || '';
        } catch (error) {
          console.error(`Error fetching state for instance ${instance.idInstance}:`, error);
          instance.status = 'Error';
        }
        return instance;
      })
    );

    return { instances: updatedInstances };
  } catch (error) {
    console.error('Error fetching instances or their state:', error);
    return { error: error.message };
  }
}
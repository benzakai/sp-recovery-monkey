import { Page, Layout, Card, TextField, Button, Form, FormLayout } from '@shopify/polaris';
import { useState, useCallback } from 'react';

export default function MessageBox() {
  const [message, setMessage] = useState('');

  const handleMessageChange = useCallback((value) => setMessage(value), []);

  const handleSendClick = () => {
    // Handle the send action, e.g., send the message to a server
    console.log('Message sent:', message);
    setMessage(''); // Clear the message box after sending
  };

  return (
    <Page title="Message Box!!">
      <Layout>
        <Layout.Section>
          <Card>
            <Form onSubmit={handleSendClick}>
              <FormLayout>
                <TextField
                  label="Your message"
                  value={message}
                  onChange={handleMessageChange}
                  multiline={4} // Set to `true` or specify the number of rows
                  autoComplete="off"
                />
                <Button submit>
                  Send
                </Button>
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

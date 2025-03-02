public class Main {
//AIzaSyAEJLkB8T4VVjDxwEA2ZdC_6P7kGsbLn5c - Gemini Key 
package com.fda.alertsystem;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Properties;
import javax.mail.*;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

@Service
public class FDAAlertService {
    private final RestTemplate restTemplate = new RestTemplate();
    private final String FDA_API_URL = "https://api.fda.gov/drug/enforcement.json?limit=5";
    private final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateText?key=YOUR_GEMINI_API_KEY";
    
    // Scheduled task to fetch and process FDA data every 24 hours
    @Scheduled(fixedRate = 86400000) // Runs every 24 hours
    public void fetchAndProcessFDAData() {
        try {
            // Fetch raw FDA data
            String fdaResponse = restTemplate.getForObject(FDA_API_URL, String.class);
            // Process the data with Gemini AI for summarization
            String formattedData = formatWithGemini(fdaResponse);
            // Send email notification with the formatted data
            sendEmailNotification("FDA Alert Update", formattedData);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    // Method to format FDA data using Gemini AI
    private String formatWithGemini(String fdaData) {
        try {
            // Construct the request payload for Gemini API
            String requestBody = "{\"prompt\": \"Summarize: " + fdaData + "\", \"max_tokens\": 200}";
            // Send request to Gemini API and return formatted response
            return restTemplate.postForObject(GEMINI_API_URL, requestBody, String.class);
        } catch (Exception e) {
            e.printStackTrace();
            return "Error processing FDA data.";
        }
    }
    
    // Method to send email notifications with FDA alerts
    private void sendEmailNotification(String subject, String body) {
        final String username = "your-email@gmail.com";
        final String password = "your-password";
        
        // Set email properties
        Properties props = new Properties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");

        // Authenticate and create session
        Session session = Session.getInstance(props, new Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(username, password);
            }
        });

        try {
            // Construct the email message
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(username));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse("recipient@example.com"));
            message.setSubject(subject);
            message.setText(body);
            
            // Send the email
            Transport.send(message);
            System.out.println("Notification email sent!");
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }
}

}

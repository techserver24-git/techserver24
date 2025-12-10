/**
 * Google Apps Script to receive form posts, save to a Google Sheet, and send confirmation email.
 *
 * Setup:
 * 1. Create a Google Sheet and note its ID.
 * 2. In the Script Editor, paste this file, set SHEET_ID, and deploy as "Web app" (execute as: Me, who has access: Anyone, even anonymous) if you want public posting.
 * 3. Configure OAuth scopes if prompted (MailApp uses permissions).
 */

var SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // <--- replace with your sheet id

function doPost(e){
  try{
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheets()[0];
    var params = e.parameter;
    var name = params.name || '';
    var email = params.email || '';
    var product = params.product || '';
    var ts = new Date();
    sheet.appendRow([ts, name, email, product]);

    // send confirmation email
    var subject = 'TechServer24 - Order Received';
    var body = 'Hi ' + name + ',\n\n' +
      'Thanks for your order of ' + product + '. We received your details and will process payment next.\n\n' +
      'Regards,\nTechServer24';
    MailApp.sendEmail(email, subject, body);

    return ContentService.createTextOutput(JSON.stringify({status:'success'})).setMimeType(ContentService.MimeType.JSON);
  }catch(err){
    return ContentService.createTextOutput(JSON.stringify({status:'error', message:err.message})).setMimeType(ContentService.MimeType.JSON);
  }
}

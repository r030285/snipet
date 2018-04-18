const AWS = require("aws-sdk");

const sts = new AWS.STS();

var params = {
  DurationSeconds: 900,
  SerialNumber: 'arn:aws:iam::<account id>:mfa/mfa-device',
  TokenCode: 'token code'
};
sts.getSessionToken(params, function(err, data) {
  if (err) console.log(err, err.stack);
  else{
    console.log(data.Credentials);
    accessS3(data.Credentials);
  }
});


const accessS3 = function(st){
    let credential = new AWS.Credentials({accessKeyId:st.AccessKeyId,
                                secretAccessKey:st.SecretAccessKey,
                                sessionToken:st.SessionToken})
    const s3 = new AWS.S3({"credentials":credential});
    let params = {Bucket: "bucket name", Key: "obj.txt"};

    s3.getObject(params, function(err, data) {
        if (err) {
            console.log(err)
        } else {
            console.log(data);
        }
});
}



const newOTP = async (req, res) => {
    try {
      const { phone_number } = req.body;
      const otp = otpGenerator.generate(4, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      const now = new Date();
      const expiration_time = AddMinutesToDate(now, 3);
      const id = uuid.v4()
      console.log(id,otp,expiration_time)
      const newOtp = await select(
        "INSERT INTO otp (id,otp,expiration_time) VALUES($1, $2 , $3) returning id;",
         id, otp, expiration_time
      );
      const details = {
        timestamp: now,
        check: phone_number,
        succes: true,
        message: "OTP sent to user",
        otp_id: newOtp.id,
      };
      const encoded = await encode(JSON.stringify(details));
      return res.send({ Status: "Succes", Details: encoded });
    } catch (error) {
      console.log(error);
    }
  };
  
  const verifyOTP = async (req,res) => {
      try {
          const {verification_key,otp,check} = req.body
          let currentdate = new Date()
          let decoded;
          try{
              decoded = await decode(verification_key)
          } catch(error){
              const response = {Status:"Failure",Details:"Bad request"}
              return res.status(400).send(response)
          }
          let obj = JSON.parse(decoded)
          const check_obj = obj.check;
          if(check_obj != check){
              const response = {
                  Status:"Failure",
                  Details:"OTP was not sent to this particular phone number",
              };
              return res.status(400).send(response)
          }
          let params = {
              id: obj.otp_id
          }
          const otpResult = await select('select * from otp where id = $1',params.id)
          const result = otpResult
          if(result != null){
              
              if(result.verified != true) {
  
                  if(dates.compare(result.expiration_time,currentdate) == 1) {
  
                      if(otp === result.otp) {
                          let params_verified = {
                              id:result.id,
                              verified:true,
                          }
                          await select('update otp set verified=$2 where id = $1',params_verified.id,params_verified.verified)
                          const clientResult = await select('select * from client where client_phone_number=$1',check)
                          if (!clientResult){
                              const response = {
                                  Status:"Succes",
                                  Details:"new",
                                  Check:check
                              }
                              return res.status(200).send(response)
                          } else {
                              console.log(clientResult)
                              const response = {
                                  Status:"Succes",
                                  Details:"old",
                                  Check:check,
                                  ClientName:clientResult.client_first_name
                              }
                              return res.status(200).send(response)
                          }
                      } else {
                          const response = {Status:"Failure",Details:"OTP NOT matched"}
                          return res.status(400).send(response)
                      }
                  } else {
                      const response = {Status:"Failure",Details:"OTP Expired"}
                      return res.status(400).send(response)
                  }
              } else{
                  const response = {Status:"Failure",Details:"OTP already used"}
                  return res.status(400).send(response)
              }
          } else{
              const response = {Status:"Failure",Details:"Bad Request"}
              return res.status(400).send(response)
          }
      } catch (error) {
          console.log(error)
          // errorHandler(res,error)
      }
  }
  
  const deleteOTP = async (req, res) => { 
      const { verification_key, check } = req.body; 
     
      let decoded; 
     
      try { 
        decoded = await decode(verification_key); 
      } catch (err) { 
        const response = { Status: "Failure", Details: "Bad Request" }; 
        return res.status(400).send(response); 
      } 
      var obj = JSON.parse(decoded); 
      const check_obj = obj.check; 
     
      if (check_obj != check) { 
        const response = { 
          Status: "Failure", 
          Details: "OTP was not sent to this particular  phone number", 
        }; 
        return res.status(400).send(response); 
      } 
      let params = { 
        id: obj.otp_id, 
      }; 
   
      const deletedOTP = await select('delete from otp where id = $1 returning id',params.id)
      if (!deletedOTP) { 
        return res.status(400).send("Invalid OTP"); 
      } 
      return res.status(200).send(params); 
  };
  
  const getOTPByID = async (req, res) => { 
      let params = { 
        id: req.params.id, 
      };
      const otpResult = await select('select * from otp where id = $1',params.id)
      const result = otpResult; 
      if (!otpResult) { 
        return res.status(400).send("Invalid OTP"); 
      } 
     
      return res.status(200).send(result); 
    };
<html>
<body>
<div>Data: <span id="spanId"></span></div>
<script>

async function getUsers() {
		// 968583157932937216 A league
		// 866171664994541568 B league
        const leagueAUsers = await fetch("https://api.sleeper.app/v1/league/968583157932937216")
									.then((res) => res.json());
		const leagueBUsers = await fetch("https://api.sleeper.app/v1/league/866171664994541568")
									.then((res) => res.json());
			document.getElementById("spanId").innerText = "Blah";
			
			//for (us)
      }
      getUsers();
	  
</script>
</body>
</html>
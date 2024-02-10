## Dockerizing ifs-router -svc
 Step 1: Create the Dockerfile 
  --- 
     command used: touch Dockerfile
   ---- 
 step 2: Build the docker image.
   ---
    command used: sudo docker build -t intelliflow/ifs-router-svc --build-arg PROFILE=colo .
   ---
   step 3: Run the docker image.
   ----
    command used: sudo docker run -p 31600:31600 ifs_router
     ---
     The above command starts the router manager image inside the container and exposes port 31600 inside container to port 31600 outside the container.
     ----

   step 4: Check the image created.
   ---
    command used: docker images
   ---
 step 5:Access the route on server using http://localhost:31600


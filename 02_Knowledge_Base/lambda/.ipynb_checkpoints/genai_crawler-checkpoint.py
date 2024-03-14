import os
from bs4 import BeautifulSoup
import uuid
import requests
#import serpapi
from serpapi import GoogleSearch
import boto3
import logging
import io

s3 = boto3.client('s3')
bucketname = os.environ['BUCKETNAME']
serpapi_api_key = os.environ['SERPAPI_API_KEY']
doc_types = {"pdf"}

def lambda_handler(event,context):
    urls = get_urls(search(event['query']))
    html_urls,pdf_urls = urls['html_urls'],urls['pdf_urls']
    download_html(html_urls)
    download_pdf(pdf_urls)

def search(q):   
    #q = '固德威股权人是谁'
    params = {
      "engine": "google",
      "q": q,
      "api_key": serpapi_api_key
    }
    
    #search = serpapi.search(params)
    
    search = GoogleSearch(params)
    results = search.get_dict()
    # results
    organic_results = results["organic_results"]
    link_lst = []
    for page in organic_results:
        link_lst.append({page['title']:page['link']})
    return link_lst

def get_urls(list) -> dict: 
    urls,file_urls,html_urls = {},[],[]
    for url_dict in list:
        for url in url_dict.values():
            #print(f'url: {url}')
            suffix = url.split('.')[-1].lower()
            if suffix in doc_types:
                file_urls.append(url)
            else:
                html_urls.append(url)
    urls['html_urls'],urls['pdf_urls'] = html_urls,file_urls
    return urls

def download_html(urls):
    for url in urls:
        try:
            response = requests.get(url)
            if response.status_code == 200:
                objectname = f'file_{uuid.uuid4()}.txt'
                data = BeautifulSoup(response.text,'html.parser').get_text()
                s3.put_object(Bucket=bucketname, Key=objectname, Body=data)
        except Exception as e:
            logging.error(e)
            
def download_pdf(urls):
    for url in urls:
        try:
            response = requests.get(url)
            if response.status_code == 200:
                objectname = f'file_{uuid.uuid4()}.{url.split(".")[-1].lower()}'
                s3.upload_fileobj(io.BytesIO(response.content), bucketname, objectname)
                #print(f'upload file {objectname} to s3')
        except Exception as e:
            logging.error(e)

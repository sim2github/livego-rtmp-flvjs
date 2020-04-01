package main

import (
	"flag"
	"log"
	"net"
	"net/http"
	"time"

	"github.com/gwuhaolin/livego/configure"
	"github.com/gwuhaolin/livego/protocol/httpflv"
	"github.com/gwuhaolin/livego/protocol/rtmp"
)

var (
	version        = "1.0.0"
	appname        = flag.String("appname", "live", "Application name")
	rtmpAddr       = flag.String("rtmp-addr", ":1935", "RTMP server listen address")
	httpFlvAddr    = flag.String("httpflv-addr", ":7001", "HTTP-FLV server listen address")
	httpStaticAddr = flag.String("http-addr", ":8080", "HTTP-Static server listen address")
)

func init() {
	log.SetFlags(log.Lshortfile | log.Ltime | log.Ldate)
	flag.Parse()

	configure.RtmpServercfg = configure.ServerCfg{
		Server: []configure.Application{
			configure.Application{
				Appname: *appname,
				Liveon:  "on",
			},
		},
	}
}

func startRtmp(stream *rtmp.RtmpStream) {
	rtmpListen, err := net.Listen("tcp", *rtmpAddr)
	if err != nil {
		log.Fatal(err)
	}

	var rtmpServer *rtmp.Server

	rtmpServer = rtmp.NewRtmpServer(stream, nil)

	defer func() {
		if r := recover(); r != nil {
			log.Println("RTMP server panic: ", r)
		}
	}()
	log.Println("RTMP Listen On", *rtmpAddr)
	rtmpServer.Serve(rtmpListen)
}

func startHTTPFlv(stream *rtmp.RtmpStream) {
	flvListen, err := net.Listen("tcp", *httpFlvAddr)
	if err != nil {
		log.Fatal(err)
	}

	hdlServer := httpflv.NewServer(stream)
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Println("HTTP-FLV server panic: ", r)
			}
		}()
		log.Println("HTTP-FLV listen On", *httpFlvAddr)
		hdlServer.Serve(flvListen)
	}()
}

func startHTTPStatic() {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Println("HTTP static server panic: ", r)
			}
		}()
		http.Handle("/", http.FileServer(http.Dir("public")))
		log.Println("Static HTTP listen On", *httpStaticAddr)
		http.ListenAndServe(*httpStaticAddr, nil)
	}()
}

func main() {
	defer func() {
		if r := recover(); r != nil {
			log.Println("livego panic: ", r)
			time.Sleep(1 * time.Second)
		}
	}()
	log.Println("start livego, version", version)
	startHTTPStatic()

	stream := rtmp.NewRtmpStream()
	startHTTPFlv(stream)
	startRtmp(stream)
}

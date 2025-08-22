# 2025-Blockthon DApp Workflow

This document outlines the key workflows of the donation DApp.

## 1. Campaign Creation Workflow

This diagram shows the process of a user creating a new donation campaign.

```mermaid
graph TD
    subgraph "캠페인 생성"
        A[기부 단체/개인이 DApp 접속] --> B['캠페인 생성' 페이지로 이동];
        B --> C[캠페인 정보 입력<br/>#40;이름, 설명, 목표 금액, 기간 등#41;];
        C --> D['생성하기' 버튼 클릭 및 트랜잭션 서명];
        D --> E[프론트엔드 → 스마트 컨트랙트<br/>'create_campaign' 함수 호출];
        E --> F[스마트 컨트랙트<br/>'DonationCampaign' 객체 온체인 생성];
        F --> G[새로운 캠페인이 DApp에 게시됨];
    end
```

## 2. Donation Workflow

This diagram shows the process of a user donating to a campaign and receiving an NFT.

```mermaid
graph TD
    subgraph "후원"
        A[후원자가 DApp 접속] --> B[캠페인 목록 확인];
        B --> C[후원하고 싶은 캠페인 선택];
        C --> D[후원 금액과 응원 메시지 입력];
        D --> E['후원하기' 버튼 클릭 및 트랜잭션 서명];
        E --> F[프론트엔드 → 스마트 컨트랙트<br/>'donate' 함수 호출];
        F --> G[스마트 컨트랙트<br/>캠페인 상태 및 기간 검증];
        G -- 검증 통과 --> H[캠페인의 총 후원액 업데이트];
        H --> I[후원 기념 NFT 발행 및<br/>후원자 지갑으로 전송];
        I --> J[후원자는 지갑에서 NFT 확인];
        G -- 검증 실패 --> K[트랜잭션 실패];
    end
```

## 3. Withdrawal Workflow

This diagram shows the process of a campaign organizer withdrawing the collected funds.

```mermaid
graph TD
    subgraph "인출"
        A[캠페인 생성자가<br/>자신의 캠페인 페이지 접속] --> B{총 후원액 >= 목표 금액인가?};
        B -- Yes --> C['인출하기' 버튼 활성화 및 클릭];
        C --> D[트랜잭션 서명];
        D --> E[프론트엔드 → 스마트 컨트랙트<br/>'withdraw' 함수 호출];
        E --> F[스마트 컨트랙트<br/>함수 호출자, 목표 금액 달성 여부 재검증];
        F -- 검증 통과 --> G[플랫폼 수수료#40;5%#41; 계산];
        G --> H[수수료를 제외한 금액을<br/>캠페인 생성자에게 전송];
        H --> I[캠페인을 '비활성' 상태로 변경];
        B -- No --> J['인출하기' 버튼 비활성화];
        F -- 검증 실패 --> K[트랜잭션 실패];
    end
```